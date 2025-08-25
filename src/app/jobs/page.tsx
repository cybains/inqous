import { getJobsCollection } from '@/lib/mongodb';

type Job = {
  _id: { toString(): string };
  title: string;
  company?: string;
};

export default async function JobsPage() {
  const collection = await getJobsCollection();
  const jobs = (await collection.find().toArray()) as Job[];

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Job Listings</h1>
      <ul className="space-y-2">
        {jobs.map((job: Job) => (
          <li key={job._id.toString()} className="border rounded p-4">
            <h2 className="font-semibold">{job.title}</h2>
            {job.company && <p>{job.company}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
