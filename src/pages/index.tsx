import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Crossword V3</title>
        <meta name="description" content="Edit and share crosswords" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>

      <main className="container mx-auto flex flex-col items-center justify-center h-screen p-4">
        <div>Hello, crossworld.</div>
      </main>
    </>
  );
};

export default Home;
