import Navbar from "../Components/Navbar";
import type { Route } from "./+types/home";
import { resumes } from "../Constants";
import ResumeCard from "~/Components/ResumeCard";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { usePuterStore } from "~/lib/puter";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumeMind" },
    { name: "description", content: "Welcome to ResumeMind!" },
  ];
}

export default function Home() {
   const { isLoading, auth } = usePuterStore();

    const navigate = useNavigate();
   

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/");
        }
    }, [auth.isAuthenticated, isLoading, navigate]);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        <h2> Review your submissions and check AI-powered feedback</h2>
      </div>
    
    {resumes.length > 0 && (
      <div className="resumes-section">
        {resumes.map((resume) => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}
      </div>
    )}
    </section>
  </main>
}
