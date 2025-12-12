import { sanitizeUrl } from "@braintree/sanitize-url";
import { useTranslate } from "@tolgee/react";
import { Button } from "@typebot.io/ui/components/Button";
import { Input } from "@typebot.io/ui/components/Input";
import { LoaderCircleIcon } from "@typebot.io/ui/icons/LoaderCircleIcon";
import { cn } from "@typebot.io/ui/lib/cn";
import { useRouter } from "next/navigation";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useQueryState } from "nuqs";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { TextLink } from "@/components/TextLink";
import { toast } from "@/lib/toast";
import { DividerWithText } from "./DividerWithText";
import { SignInError } from "./SignInError";
import { SocialLoginButtons } from "./SocialLoginButtons";

type Props = {
  defaultEmail?: string;
  className?: string;
};

export const SignInForm = ({ defaultEmail, className }: Props) => {
  const { t } = useTranslate();
  const router = useRouter();
  const [authError, setAuthError] = useQueryState("error");
  const [redirectPath] = useQueryState("redirectPath");
  const { status } = useSession();
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

  const [emailValue, setEmailValue] = useState(defaultEmail ?? "");

  const [providers, setProviders] =
    useState<Awaited<ReturnType<typeof getProviders>>>();

  const hasNoAuthProvider =
    !isLoadingProviders && Object.keys(providers ?? {}).length === 0;

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirectPath ? sanitizeUrl(redirectPath) : "/typebots");
      return;
    }
    (async () => {
      const providers = await getProviders();
      setProviders(providers ?? undefined);
      setIsLoadingProviders(false);
    })();
  }, [status, router]);

  useEffect(() => {
    if (authError === "ip-banned") {
      toast({
        type: "info",
        description:
          "Your account has suspicious activity and is being reviewed by our team. Feel free to contact us.",
      });
    }
  }, [authError]);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signIn("credentials", {
        email: emailValue,
        redirect: true,
        callbackUrl: redirectPath ? sanitizeUrl(redirectPath) : "/typebots",
      });
    } catch (_e) {
      toast({
        type: "info",
        description: "An error occured while signing in",
      });
    }
    setAuthLoading(false);
  };

  if (isLoadingProviders) return <LoaderCircleIcon className="animate-spin" />;
  if (hasNoAuthProvider)
    return (
      <p>
        {t("auth.noProvider.preLink")}{" "}
        <TextLink
          href="https://docs.typebot.io/self-hosting/configuration"
          isExternal
        >
          {t("auth.noProvider.link")}
        </TextLink>
      </p>
    );
  return (
    <div className={cn("flex flex-col gap-6 w-[330px]", className)}>
      <>
        <SocialLoginButtons providers={providers} />
        <DividerWithText>{t("auth.orEmailLabel")}</DividerWithText>
        <form className="flex items-center gap-2" onSubmit={handleEmailSubmit}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="email@company.com"
            required
            value={emailValue}
            onValueChange={setEmailValue}
          />
          <Button
            type="submit"
            disabled={
              ["loading", "authenticated"].includes(status) || authLoading
            }
          >
            {t("auth.emailSubmitButton.label")}
          </Button>
        </form>
      </>
      {authError && <SignInError error={authError} />}
    </div>
  );
};
