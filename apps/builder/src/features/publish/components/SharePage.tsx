import { useTranslate } from "@tolgee/react";
import { env } from "@typebot.io/env";
import { isDefined, isNotDefined } from "@typebot.io/lib/utils";
import { Plan } from "@typebot.io/prisma/enum";
import { Badge } from "@typebot.io/ui/components/Badge";
import { Button } from "@typebot.io/ui/components/Button";
import { useOpenControls } from "@typebot.io/ui/hooks/useOpenControls";
import { SquareLock01Icon } from "@typebot.io/ui/icons/SquareLock01Icon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Seo } from "@/components/Seo";
import {
  WhatsAppLogo,
  whatsAppBrandColor,
} from "@/components/logos/WhatsAppLogo";
import { UpgradeButton } from "@/features/billing/components/UpgradeButton";
import { hasProPerks } from "@/features/billing/helpers/hasProPerks";
import { CustomDomainsDropdown } from "@/features/customDomains/components/CustomDomainsDropdown";
import DomainStatusIcon from "@/features/customDomains/components/DomainStatusIcon";
import { TypebotHeader } from "@/features/editor/components/TypebotHeader";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { isCloudProdInstance } from "@/helpers/isCloudProdInstance";
import { toast } from "@/lib/toast";
import { getPublicId } from "../helpers/getPublicId";
import { isPublicDomainAvailableQuery } from "../queries/isPublicDomainAvailableQuery";
import { WhatsAppDeployDialog } from "./deploy/dialogs/whatsApp/WhatsAppDeployDialog";
import { EditableUrl } from "./EditableUrl";

export const SharePage = () => {
  const { t } = useTranslate();
  const { workspace } = useWorkspace();
  const router = useRouter();
  const { typebot, updateTypebot, publishedTypebot, currentUserMode } =
    useTypebot();
  const {
    isOpen: isWhatsAppDialogOpen,
    onOpen: onWhatsAppDialogOpen,
    onClose: onWhatsAppDialogClose,
  } = useOpenControls();

  const publicId = getPublicId(typebot);
  const isPublished = isDefined(publishedTypebot);

  // Auto-open WhatsApp dialog on first publish
  useEffect(() => {
    if (router.query.openWhatsApp === "true") {
      onWhatsAppDialogOpen();
      // Clean up the query param from the URL without navigation
      const { openWhatsApp, ...restQuery } = router.query;
      router.replace(
        { pathname: router.pathname, query: restQuery },
        undefined,
        { shallow: true }
      );
    }
  }, [router.query.openWhatsApp]);

  const handlePublicIdChange = async (publicId: string) => {
    updateTypebot({ updates: { publicId }, save: true });
  };

  const handlePathnameChange = (pathname: string) => {
    if (!typebot?.customDomain) return;
    const existingHost = typebot.customDomain?.split("/")[0];
    const newDomain =
      pathname === "" ? existingHost : existingHost + "/" + pathname;
    handleCustomDomainChange(newDomain);
  };

  const handleCustomDomainChange = (customDomain: string | null) =>
    updateTypebot({ updates: { customDomain }, save: true });

  const checkIfPathnameIsValid = (pathname: string) => {
    const isCorrectlyFormatted =
      /^([a-z0-9]+-[a-z0-9]*)*$/.test(pathname) || /^[a-z0-9]*$/.test(pathname);

    if (!isCorrectlyFormatted) {
      toast({
        description: "Can only contain lowercase letters, numbers and dashes.",
      });
      return false;
    }
    return true;
  };

  const checkIfPublicIdIsValid = async (publicId: string) => {
    const isLongerThanAllowed = publicId.length >= 4;
    if (!isLongerThanAllowed && isCloudProdInstance()) {
      toast({
        description: "Should be longer than 4 characters",
      });
      return false;
    }

    if (!checkIfPathnameIsValid(publicId)) return false;

    const { data } = await isPublicDomainAvailableQuery(publicId);
    if (!data?.isAvailable) {
      toast({ description: "ID is already taken" });
      return false;
    }

    return true;
  };

  return (
    <div className="flex flex-col h-screen overflow-y-auto bg-gray-2">
      <Seo title={typebot?.name ? `${typebot.name} | Share` : "Share"} />
      <TypebotHeader />
      <div className="flex h-full w-full justify-center items-start">
        <div className="flex flex-col max-w-[970px] w-full pt-10 gap-10 pb-20">
          <div className="flex flex-col gap-4 items-start">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("sharePage.links.heading")}
            </h1>
            <div className="flex flex-col gap-4 p-6 rounded-xl w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] shadow-sm">
              {typebot && (
                <EditableUrl
                  hostname={env.NEXT_PUBLIC_VIEWER_URL[0]}
                  pathname={publicId}
                  isValid={checkIfPublicIdIsValid}
                  onPathnameChange={handlePublicIdChange}
                />
              )}
              {typebot?.customDomain && (
                <div className="flex items-center gap-2">
                  <EditableUrl
                    hostname={"https://" + typebot.customDomain.split("/")[0]}
                    pathname={typebot.customDomain.split("/")[1]}
                    isValid={checkIfPathnameIsValid}
                    onPathnameChange={handlePathnameChange}
                  />
                  <Button
                    className="size-7 [&_svg]:size-3"
                    aria-label="Remove custom URL"
                    size="icon"
                    onClick={() => handleCustomDomainChange(null)}
                  >
                    <TrashIcon />
                  </Button>
                  {workspace?.id && (
                    <DomainStatusIcon
                      domain={typebot.customDomain.split("/")[0]}
                      workspaceId={workspace.id}
                    />
                  )}
                </div>
              )}
              {currentUserMode === "write" &&
              isNotDefined(typebot?.customDomain) &&
              env.NEXT_PUBLIC_VERCEL_VIEWER_PROJECT_NAME ? (
                hasProPerks(workspace) ? (
                  <CustomDomainsDropdown
                    onCustomDomainSelect={handleCustomDomainChange}
                  />
                ) : (
                  <UpgradeButton
                    limitReachedType={t("billing.limitMessage.customDomain")}
                    excludedPlans={[Plan.STARTER]}
                  >
                    {t("customDomain.add")}
                    <Badge colorScheme="purple">
                      <SquareLock01Icon />
                    </Badge>
                  </UpgradeButton>
                )
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("sharePage.embed.heading")}
            </h1>
            <div className="flex flex-wrap gap-4">
              <Button
                className="w-[225px] h-[270px] text-center whitespace-normal rounded-xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 hover:border-yellow-400 hover:bg-white dark:hover:bg-[#1A1A1A] shadow-sm hover:shadow-md transition-all"
                variant="ghost"
                onClick={onWhatsAppDialogOpen}
                iconStyle="none"
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <WhatsAppLogo
                    className="w-[60px] h-[100px]"
                    color={whatsAppBrandColor}
                  />
                  <p>WhatsApp</p>
                </div>
              </Button>
              <WhatsAppDeployDialog
                isOpen={isWhatsAppDialogOpen}
                onClose={onWhatsAppDialogClose}
                publicId={publicId}
                isPublished={isPublished}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
