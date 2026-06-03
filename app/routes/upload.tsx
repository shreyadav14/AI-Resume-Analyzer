import React, { type FormEvent } from 'react';
import Navbar from '~/Components/Navbar';
import { useState } from 'react';
import { usePuterStore } from '~/lib/puter';
import FileUploader from '~/Components/fileUploader';

const Upload = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { auth } = usePuterStore();

  const handleFileSelect = (file: File): void => {
    setFile(file);
    const form:HTMLFormElement | null = document.querySelector('#upload-form');
    if (form) {
      const formData = new FormData(form);
      formData.append('resume', file);
       formData.append('userId', (auth.user as any)?.uuid || '');
        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;
        console.log({ companyName, jobTitle, jobDescription, file });
    }
  };

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>
  ): void => {
    e.preventDefault();
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>

              <img
                src="/images/resume-scan.gif"
                className="w-full"
                alt="Scanning resume"
              />
            </>
          ) : (
            <h2>
              Drop your resume for an ATS score and improvement tips
            </h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>

                <input
                  type="text"
                  id="company-name"
                  placeholder="Company Name"
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>

                <input
                  type="text"
                  id="job-title"
                  placeholder="Job Title"
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>

                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>

                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
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