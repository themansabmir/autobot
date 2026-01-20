import { useTranslate } from "@tolgee/react";
import { useRouter } from "next/router";
import { Seo } from "@/components/Seo";
import { SignInForm } from "./SignInForm";
import { AuthLayout } from "./AuthLayout";
import { UserIcon } from "@typebot.io/ui/icons/UserIcon";
import { Mail01Icon } from "@typebot.io/ui/icons/Mail01Icon";

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

      {/* Secure Sign-In Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] border-t-2 border-t-[#FFE600] border-x border-b border-gray-200 dark:border-gray-800 shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 md:p-12 flex flex-col gap-8 relative z-20">

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Secure Sign-In</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Identity verification for Chatbot Builder Platform.</p>
        </div>

        <SignInForm defaultEmail={query.g?.toString()} className="w-full" />

        <div className="flex flex-col items-center gap-4 text-sm mt-2">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            {type === "signin" ? (
              <>
                <span>Don&apos;t have an account?</span>
                <a href="/register" className="font-semibold text-gray-900 dark:text-white hover:underline decoration-yellow-400 underline-offset-4">Sign up</a>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <a href="/signin" className="font-semibold text-gray-900 dark:text-white hover:underline decoration-yellow-400 underline-offset-4">Sign in</a>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
            <span className="opacity-50">Need Help?</span>
            <a href="#" className="flex items-center gap-2 hover:text-[#FFE600] transition-colors">
              <UserIcon className="size-3" />
              IT Support Helpdesk
            </a>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
