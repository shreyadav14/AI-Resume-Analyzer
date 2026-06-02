import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router';
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
    { title: "ResumeMind | Authentication" },
    { name: "description", content: "Login or Sign up to ResumeMind" },
];

const Auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const navigate = useNavigate();
    const next = new URLSearchParams(location.search).get("next") || "/";

    useEffect(() => {
        if (auth.isAuthenticated) {
            navigate(next);
        }
    }, [auth.isAuthenticated, navigate, next]);

  return (
    <div>
    <main className ="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
    <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
            <div className="flex flex-col items-center gap-2 text-center">
                <h1>Welcome</h1>
                <h2> Log In to continue Your Job Journey </h2>
            </div>
            <div>
             {isLoading ? (
                <button className="auth-button animate-pulse">
                    <p>Loading... Signing you in...</p>
                    </button>
             ) : (
                <>
                {auth.isAuthenticated?(
                    <button className="auth-button" onClick={auth.signOut}>
                       <p> Logout</p>
                    </button>
                ):(
                    <button className="auth-button" onClick={auth.signIn}>
                        <p>login</p>
                    </button>
                )}
                </>
             )}
            </div>
        </section>
    </div>
    </main>
    </div>
  )
}

export default Auth
