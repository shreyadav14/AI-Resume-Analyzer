import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import Details from "~/Components/Details";
import { usePuterStore } from "~/lib/puter";
import ATS from "~/Components/ATS";
import Summary from "~/Components/summary";
export const meta = () => [
  { title: "ResumeMind | Review" },
  { name: "description", content: "Overview of your resume" },
];

interface ResumeData {
  id: string;
  companyName?: string;
  jobTitle?: string;
  imagePath: string;
  resumePath: string;
  feedback: unknown;
}

const Resume = () => {
  const { fs, kv, auth, isLoading } = usePuterStore();
  const { id } = useParams();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const navigate = useNavigate();

  const atsSuggestions = React.useMemo(() => {
    if (!feedback?.ATS?.tips) {
      return [];
    }

    if (Array.isArray(feedback.ATS.tips)) {
      return feedback.ATS.tips;
    }

    if (typeof feedback.ATS.tips === 'object') {
      return Object.values(feedback.ATS.tips).map((item) =>
        typeof item === 'string'
          ? { type: 'improve', tip: item }
          : item
      );
    }

    return [];
  }, [feedback]);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [auth.isAuthenticated, isLoading, navigate, id]);
  useEffect(() => {
    if (!id) {
      setPageError("Resume ID is missing.");
      setLoading(false);
      return;
    }

    let active = true;
    let currentObjectUrl: string | null = null;

    const loadResume = async () => {
      setLoading(true);
      setPageError(null);

      try {
        const storedResume = await kv.get(`resume:${id}`);
        if (!storedResume) {
          setPageError("Resume not found.");
          return;
        }

        const parsed = JSON.parse(storedResume) as ResumeData;
        setResumeData(parsed);
        setFeedback(parsed.feedback);

        if (parsed.imagePath) {
          const imageBlob = await fs.read(parsed.imagePath);
          if (imageBlob) {
            currentObjectUrl = URL.createObjectURL(imageBlob);
            if (active) {
              setImageUrl(currentObjectUrl);
            }
          }
        }
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load resume."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadResume();

    return () => {
      active = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [id, fs, kv]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img
            src="/icons/back.svg"
            alt="Back"
            className="w-2.5 h-2.5"
          />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {loading ? (
            <div>Loading resume...</div>
          ) : pageError ? (
            <div className="text-red-600">{pageError}</div>
          ) : (
            <>
              {imageUrl ? (
                <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-w-xl:h-fit w-fit">
                  <img
                    src={imageUrl}
                    alt="Resume preview"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              ) : (
                <div>No preview available.</div>
              )}

              {resumeData && (
                <div className="mt-6 space-y-2">
                  <p>
                    <strong>Job Title:</strong> {resumeData.jobTitle ?? "-"}
                  </p>
                  <p>
                    <strong>Company:</strong> {resumeData.companyName ?? "-"}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
        <section className="feedback-section">
            <h2 className="text-4xl !text-black font-bold"> Resume Review</h2>
            {feedback ? (
              <div>
                <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                 <Summary feedback={feedback} />
                 <ATS score={feedback?.ATS?.score || 0} suggestions={atsSuggestions} />
                 <Details feedback={feedback} />

                </div>
              </div>
            ) : (
              <img src="/images/resume-scan-2.gif" className="w-full" />
            )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
   