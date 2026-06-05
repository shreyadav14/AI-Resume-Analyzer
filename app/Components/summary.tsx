import React from 'react';
import ScoreGauge from './scoreGauge';

interface SummaryProps {
  feedback: Feedback | null;
}

const Category = ({ title, score }: { title: string; score: number }) => {
  const textColor =
    score > 70
      ? 'text-green-600'
      : score > 49
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="resume-summary">
      <div className="Category">
        <div className="flex flex-row gap-2 items-center justify-center">
          <p className="text-2xl">{title}</p>
        </div>
        <p className="text-2xl">
          <span className={textColor}>{score}</span>/100
        </p>
      </div>
    </div>
  );
};

const Summary: React.FC<SummaryProps> = ({ feedback }) => {
  const tone = feedback?.toneAndStyle?.score ?? 0;
  const content = feedback?.content?.score ?? 0;
  const structure = feedback?.structure?.score ?? 0;
  const skills = feedback?.skills?.score ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      <div className="flex flex-row items-center p-4 gap-8">
        <ScoreGauge score={feedback?.overallScore ?? 0} />

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your Resume Score</h2>
          <p className="text-sm text-gray-500">
            This score is calculated based on the key resume areas below.
          </p>
        </div>
      </div>

      <Category title="Tone & Style" score={tone} />
      <Category title="Content" score={content} />
      <Category title="Structure" score={structure} />
      <Category title="Skills" score={skills} />
    </div>
  );
};

export default Summary;
