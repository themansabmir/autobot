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
      router.replace(redirectPath ? sanitizeUrl(redirectPath) : "/dashboard");
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
        callbackUrl: redirectPath ? sanitizeUrl(redirectPath) : "/dashboard",
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
      <SocialLoginButtons providers={providers} />
      <DividerWithText className="text-[10px] tracking-widest font-bold text-gray-11 opacity-50 uppercase">
        OR OTP LOGIN
      </DividerWithText>
      <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400"
          >
            Work Email Address
          </label>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="firstname.lastname@ey.com"
            required
            value={emailValue}
            onValueChange={setEmailValue}
            className="bg-white dark:bg-black/50 border-gray-300 dark:border-gray-800 h-12 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-[#FFE600] focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-800">
          <span className="text-[#FFE600] mt-0.5 text-sm">ℹ</span>
          <span>
            A 6-digit code will be sent to your email for secure verification.
          </span>
        </div>

        <Button
          type="submit"
          disabled={
            ["loading", "authenticated"].includes(status) || authLoading
          }
          className="w-full h-12 bg-[#1A1A1A] text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 font-bold text-base mt-2 shadow-lg dark:shadow-none transition-all"
        >
          Send One-Time Password
          <span className="ml-2">✉</span>
        </Button>
      </form>
      {authError && <SignInError error={authError} />}
    </div>
  );
};
