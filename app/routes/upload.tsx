import React, { type FormEvent, useState } from "react";
import Navbar from "~/Components/Navbar";
import FileUploader from "~/Components/fileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID, normalizeFeedback } from "~/lib/utils";
import { prepareInstructions } from "~/Constants/index";
const Upload = () => {
  const { fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (selectedFile: File): void => {
    setFile(selectedFile);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    try {
      setIsProcessing(true);

      setStatusText("Uploading resume...");

      if (!file) {
  alert("Please upload a resume.");
  return;
}

      const uploadFile = await fs.upload([file]);

      if (!uploadFile) {
        setStatusText("Failed to upload resume.");
        return;
      }

      setStatusText("Converting PDF to image...");

      const imageResult = await convertPdfToImage(file);
      const imageFile = imageResult.file;

      if (!imageFile) {
        console.error("PDF conversion failed:", imageResult.error);
        setStatusText(
          imageResult.error
            ? `PDF conversion failed: ${imageResult.error}`
            : "Failed to convert PDF. Please upload a valid PDF file."
        );
        return;
      }

      setStatusText("Uploading image...");

      const uploadedImage = await fs.upload([imageFile]);

      if (!uploadedImage) {
        setStatusText("Failed to upload image.");
        return;
      }

      setStatusText("Analyzing resume...");

      const prompt = `
Company Name: ${companyName}

Job Title: ${jobTitle}

Job Description:
${jobDescription}

Analyze this resume and provide ATS feedback, strengths, weaknesses, keyword matching, and improvement suggestions.
`;

      const aiResponse = await ai.feedback(
        uploadFile.path,
        prompt
      );

      const uuid = generateUUID();

      const data = {
        id: uuid,
        resumePath: uploadFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: aiResponse,
      };

      await kv.set(
        `resume:${uuid}`,
        JSON.stringify(data)
      );

      setStatusText(
        "Analysis complete! Redirecting..."
      );

      const feedback: AIResponse | undefined = await ai.feedback(
        uploadFile.path,
        prepareInstructions({
          jobTitle,
          jobDescription,
          AIResponseFormat: "json",
        })
      );
      if (!feedback) {
        setStatusText("Failed to get feedback from AI.");
        return;
      }

      const feedbackText: any =
        typeof feedback === "string" ? feedback : JSON.stringify(feedback);

      let parsedFeedback: any = null;
      try {
        parsedFeedback = JSON.parse(feedbackText);
      } catch (err) {
        console.warn("Failed to parse AI feedback JSON:", err);
      }

      data.feedback = normalizeFeedback(parsedFeedback);

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText(
          "Feedback received! Redirecting..."
        );

        console.log("AI Feedback:", data.feedback);       
      navigate(`/resume/${uuid}`);

      
    } catch (error) {
      console.error(error);
      setStatusText("Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a resume.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const companyName =
      (formData.get("company-name") as string) || "";

    const jobTitle =
      (formData.get("job-title") as string) || "";

    const jobDescription =
      (formData.get("job-description") as string) || "";

    await handleAnalyze({
      companyName,
      jobTitle,
      jobDescription,
      file,
    });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          <h2>
            {isProcessing
              ? statusText
              : "Drop your resume for an ATS score and improvement tips"}
          </h2>

          {isProcessing && (
            <img
              src="/images/resume-scan.gif"
              className="w-full"
              alt="Scanning resume"
            />
          )}

          {!isProcessing && statusText && (
            <p className="mt-4 text-sm text-red-600">{statusText}</p>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">
                  Company Name
                </label>

                <input
                  type="text"
                  id="company-name"
                  name="company-name"
                  placeholder="Company Name"
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">
                  Job Title
                </label>

                <input
                  type="text"
                  id="job-title"
                  name="job-title"
                  placeholder="Job Title"
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">
                  Job Description
                </label>

                <textarea
                  rows={5}
                  id="job-description"
                  name="job-description"
                  placeholder="Job Description"
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">
                  Upload Resume
                </label>

                <FileUploader
                  onFileSelect={handleFileSelect}
                />
              </div>

              <button
                className="primary-button"
                type="submit"
              >
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;