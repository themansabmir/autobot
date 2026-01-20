import { useTranslate } from "@tolgee/react";
import { useRouter } from "next/router";
import { Seo } from "@/components/Seo";
import { TextLink } from "@/components/TextLink";
import { AuthLayout } from "./AuthLayout";
import { SignInForm } from "./SignInForm";

type Props = {
  type: "signin" | "signup";
  defaultEmail?: string;
};

export const SignInPage = ({ type }: Props) => {
  const { t } = useTranslate();
  const { query } = useRouter();

  return (
    <AuthLayout>
      <Seo
        title={
          type === "signin"
            ? t("auth.signin.heading")
            : t("auth.register.heading")
        }
      />
      <div className="flex flex-col w-full max-w-md p-8 rounded-lg gap-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {type === "signin"
              ? t("auth.signin.heading")
              : t("auth.register.heading")}
          </h2>
          {type === "signin" ? (
            <p className="text-gray-500 dark:text-gray-400">
              {t("auth.signin.noAccountLabel.preLink")}{" "}
              <TextLink
                href="/register"
                className="font-semibold text-[#FFE600] hover:text-[#E6CF00]"
              >
                {t("auth.signin.noAccountLabel.link")}
              </TextLink>
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              {t("auth.register.alreadyHaveAccountLabel.preLink")}{" "}
              <TextLink
                href="/signin"
                className="font-semibold text-[#FFE600] hover:text-[#E6CF00]"
              >
                {t("auth.register.alreadyHaveAccountLabel.link")}
              </TextLink>
            </p>
          )}
        </div>

        <SignInForm defaultEmail={query.g?.toString()} />
      </div>
    </AuthLayout>
  );
};
