import type { ReactNode } from "react";
import { SecurityBadges } from "./SecurityBadges";
import { LockIcon } from "@typebot.io/ui/icons/LockIcon";
import { SunIcon } from "@typebot.io/ui/icons/SunIcon";
import { MoonIcon } from "@typebot.io/ui/icons/MoonIcon";
import { useTheme } from "next-themes";
import { Button } from "@typebot.io/ui/components/Button";

type Props = {
    children: ReactNode;
};

export const AuthLayout = ({ children }: Props) => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="min-h-screen bg-gray-2 text-gray-12 font-sans relative flex flex-col">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            </div>

            {/* Header */}
            <header className="relative z-10 w-full p-8 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-[#FFE600] text-black font-bold px-2 py-1 text-xl rounded-sm">EY</div>
                    <span className="font-bold text-xl tracking-wide uppercase text-gray-12">Secure Gateway</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-all"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        {theme === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                {children}
                <SecurityBadges />
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full p-8 flex justify-between items-end text-[10px] text-gray-11 border-t border-gray-200 dark:border-gray-800 mt-auto">
                <div className="flex flex-col gap-1 max-w-2xl text-gray-500 dark:text-gray-500">
                    <p>© 2024 EY GLOBAL SERVICES LIMITED. THIS IS A RESTRICTED SYSTEM. AUTHORIZED USE ONLY. ALL ACTIVITIES ARE LOGGED AND MONITORED. FAILURE TO COMPLY WITH EY INFORMATION SECURITY POLICIES MAY RESULT IN DISCIPLINARY ACTION.</p>
                </div>
                <div className="flex items-center gap-6 font-bold tracking-widest uppercase">
                    <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">Terms of Use</a>
                    <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">Cookies</a>
                </div>
            </footer>
        </div>
    );
};
