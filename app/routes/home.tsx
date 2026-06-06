import Navbar from "../Components/Navbar";
import type { Route } from "./+types/home";
import { resumes as sampleResumes } from "../Constants";
import ResumeCard from "~/Components/ResumeCard";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumeMind" },
    { name: "description", content: "Welcome to ResumeMind!" },
  ];
}

export default function Home() {
  const { kv } = usePuterStore();
  const [savedResumes, setSavedResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  const displayResumes = savedResumes.length > 0 ? savedResumes : sampleResumes;

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      const resumeItems = (await kv.list("resume:*", true)) as KVItem[] | undefined;
      const parsedResumes = (resumeItems ?? []).map((item) =>
        JSON.parse(item.value) as Resume
      );
      setSavedResumes(parsedResumes);
      setLoadingResumes(false);
    };

    loadResumes();
  }, [kv]);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && displayResumes.length === 0 ? (
            <h2>No resumes found</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback</h2>
          )}
        </div>

        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && displayResumes.length > 0 && (
          <div className="resumes-section">
            {displayResumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {!loadingResumes && displayResumes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
