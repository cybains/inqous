"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  company_name: string;
  category?: string;
  url: string | null;
  job_type: string | null;
  candidate_required_location: string | null;
  publication_date: string;
  salary: string | null;
  description: string | null;    // may be HTML from source
  company_logo?: string | null;
  tags?: string[];
};

type JobsResponse = {
  jobs: Job[];
  page: number;
  limit: number;
  totalJobs: number;
};

async function getJobs(page = 1, limit = 20): Promise<JobsResponse> {
  const url = `/api/jobs?page=${page}&limit=${limit}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error(`Failed to fetch jobs: ${res.status}`);
      return { jobs: [], page, limit, totalJobs: 0 };
    }
    const data = await res.json();
    return {
      jobs: data.jobs ?? [],
      page: data.page ?? page,
      limit: data.limit ?? limit,
      totalJobs: data.totalJobs ?? data.total ?? 0,
    };
  } catch (err) {
    console.error("Error while fetching jobs:", err);
    return { jobs: [], page, limit, totalJobs: 0 };
  }
}

export default function JobsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    getJobs(currentPage, limit).then((data) => {
      setJobs(data.jobs);
      setTotalJobs(data.totalJobs);
      setLoading(false);
      setExpandedJobId(null); // close any expanded job on page change
    });
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalJobs / limit));

  const handlePageChange = (newPage: number) => {
    const p = Math.min(Math.max(newPage, 1), totalPages);
    router.push(`/dashboard/jobs?page=${p}`);
  };

  const toggleExpand = (id: string) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const start = 1;
    const end = Math.min(5, totalPages);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded border-gray-300 ${currentPage === i ? "bg-black text-white" : ""}`}
        >
          {i}
        </button>
      );
    }

    if (totalPages > 5) {
      pages.push(
        <span key="dots" className="px-2">
          …
        </span>
      );

      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 border rounded border-gray-300 ${currentPage === totalPages ? "bg-black text-white" : ""}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-red-600">No jobs found.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-4">
          {jobs.map((job) => {
            const isExpanded = expandedJobId === job.id;

            return (
              <div
                key={job.id}
                onClick={() => toggleExpand(job.id)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow"
              >
                <div className="mb-2 flex items-center justify-between">
                  {/* Left: Title + company logo */}
                  <div className="flex items-center gap-3">
                    {job.company_logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={job.company_logo}
                        alt={`${job.company_name} logo`}
                        className="h-10 w-10 rounded object-contain"
                      />
                    )}
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                  </div>

                  {/* Right: publication date */}
                  <span className="text-sm text-gray-500">
                    {new Date(job.publication_date).toLocaleDateString()}
                  </span>
                </div>

                {/* Collapsed info */}
                {!isExpanded && (
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>{job.candidate_required_location ?? "—"}</span>
                    {job.job_type && <span>{job.job_type}</span>}
                    {job.salary && <span>{job.salary}</span>}
                  </div>
                )}

                {/* Expanded */}
                {isExpanded && (
                  <>
                    <p className="mt-2 text-gray-700">
                      <strong>Company:</strong> {job.company_name}
                    </p>
                    {job.category && (
                      <p className="text-gray-700">
                        <strong>Category:</strong> {job.category}
                      </p>
                    )}

                    {/* Tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {job.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description (source HTML is common; render as-is) */}
                    <div
                      className="mt-4 max-h-96 overflow-auto text-gray-700"
                      dangerouslySetInnerHTML={{ __html: job.description ?? "" }}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Action */}
                    <div className="mt-4">
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          See the job posting
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
        >
          Previous
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  );
}
