This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This project now uses the built-in Next.js API route for resume parsing, so it can be deployed to Vercel without running a separate Python backend. The `/api/upload` endpoint handles PDF, DOCX and TXT files directly inside a Node.js serverless function.

Before deploying make sure to configure the following environment variables in Vercel:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Prisma connection string (e.g. a hosted PostgreSQL or MongoDB URI). |
| `MONGODB_URI`, `MONGODB_DB` | Required if you keep storing originals in MongoDB GridFS. |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Required for NextAuth. |

Deploy using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). Refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
