"use client";

import { auth } from "@/lib/firebase.config";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import Loader from "./loading";
import Select from "react-select";
import { companyOptions } from "@/lib/utils";
import axios from "axios";
import { PredictionType } from "@/lib/types";
import GaugeComponent from "react-gauge-component";

const Dashboard = () => {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const headerRef = useRef<HTMLHeadingElement>(null);
  const [signOut] = useSignOut(auth);
  const [predictions, setPredictions] = useState<PredictionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_PREDICTIONS_API_URL;

  const handleScroll = () => {
    if (headerRef.current) {
      const scrollTop = window.scrollY;
      if (scrollTop > 0) {
        headerRef.current.classList.add("shadow-md");
      } else {
        headerRef.current.classList.remove("shadow-md");
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      window.addEventListener("scroll", handleScroll);
      handleScroll(); 

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const news = formData.get("news") as string;
    const ticker = formData.get("company") as string;

    if (news && ticker) {
      setIsLoading(true); 
      try {
        const response = await axios.post(`${apiUrl}/predict`, {
          headline: news,
          ticker: Number(ticker),
        });
        setPredictions(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false); 
      }
    }
  };

  if (loading) return <Loader />; 

  return (
    <section className="flex flex-col justify-center">
      <header
        ref={headerRef}
        className="sticky top-0 z-10 bg-white transition-shadow duration-300"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-5">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="logo img"
                width={276}
                height={85}
                quality={95}
                priority
                className="w-[200px] max-sm:w-[150px]"
              />
            </Link>
            <button onClick={handleSignOut} className="font-semibold">
              <p className="special_underline">Sign out</p>
            </button>
          </div>
        </div>
      </header>
      <div className="p-5 text-center space-y-4 mt-8">
        <h1 className="max-w-5xl mx-auto text-5xl font-bold max-md:text-3xl">
          Track News Sentiment, Predict{" "}
          <span className="text-primary">Stock Movement</span>
        </h1>
        <p className="max-w-xl mx-auto font-medium text-xl max-md:text-[18px] max-sm:text-[16px] text-zinc-500">
          Simply enter a news headline and select the corresponding stock
          company, and we will provide you with the probability of market
          movement.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto w-full flex flex-col items-center gap-3 px-5"
      >
        <input
          type="text"
          name="news"
          placeholder="Enter news headline"
          required
          className="py-[10px] px-4 border border-gray-300 rounded-md 
            font-medium w-full text-ellipsis outline-none
            focus:border-primary"
            onChange={(e) => {
              const value = e.target.value;
              const wordCount = value.trim().split(/\s+/).length;
          
              if (wordCount < 10) {
                e.target.setCustomValidity('Please enter at least 10 words.');
              } else {
                e.target.setCustomValidity('');
              }
            }}
        />
        <Select
          name="company"
          options={companyOptions}
          isSearchable
          required
          placeholder="Select Company"
          className="w-full max-w-xs"
        />
        <button
          type="submit"
          className="px-5 py-3 font-semibold text-white bg-gradient-to-r 
        from-primary to-primary_light rounded-md hover:opacity-90
        max-sm:text-sm"
          disabled={isLoading} 
        >
          {isLoading ? "Loading..." : "Analyze"} 
        </button>
      </form>
      <div className={`my-8 mx-5 max-w-6xl mx-auto rounded-xl shadow-md bg-slate-50 max-sm:mx-5 ${predictions && "p-8"}`}>
  {predictions && !isLoading ? (
    <div className="flex flex-col gap-4 justify-center items-center">
      <div className="flex flex-col justify-center gap-8"> 
        <div className="text-center pt-3 text-lg font-semibold max-md:text-sm">
          <h1 className="mb-2">Chances of Closing Price Increasing</h1>
          <GaugeComponent
            type="semicircle"
            arc={{
              colorArray: ['#00FF15', '#FFC107', '#FF2121'],
              padding: 0.02,
              subArcs: [
                { limit: 33 },
                { limit: 66 },
                {},
              ],
            }}
            pointer={{ type: "blob", animationDelay: 0 }}
            value={predictions.probability_close * 100}
            labels={{
              valueLabel: {
                formatTextValue: () => `${(predictions.probability_close * 100).toFixed(2)}%`,
                matchColorWithArc: true,
              }
            }}
          />
        </div>
        <div className="text-center pt-3 text-lg font-semibold max-md:text-sm">
          <h1 className="mb-2">Chances of Trade Volume Increasing</h1>
          <GaugeComponent
            type="semicircle"
            arc={{
              colorArray: ['#00FF15', '#FFC107', '#FF2121'],
              padding: 0.02,
              subArcs: [
                { limit: 33 },
                { limit: 66 },
                {},
              ],
            }}
            pointer={{ type: "blob", animationDelay: 0 }}
            value={predictions.probability_trade * 100}
            labels={{
              valueLabel: {
                formatTextValue: () => `${(predictions.probability_trade * 100).toFixed(2)}%`,
                matchColorWithArc: true,
              }
            }}
          />
        </div>
      </div>
      <p className="text-xl font-bold text-primary text-center max-sm:text-sm px-6 py-4">
        The closing price is expected to
        <span className={`${predictions.predicted_close >= 0 ? "text-green-500" : "text-red-500"}`}>   {`${predictions.predicted_close >= 0 ? "increase" : "decrease"} by `}{Math.abs(predictions.predicted_close).toFixed(2)}%</span>
      </p>
    </div>
  ) : null}
</div>
{predictions && <footer className="p-5 border border-zinc-300">
      <div
        className="max-w-7xl mx-auto text-zinc-500
      flex items-center justify-between text-sm
      max-sm:flex-col gap-2"
      >
    
  <p className="text-xs text-zinc-500 text-center mt-4 pb-4 px-5 mx-auto font-semibold">
      <span className="text-red-500"> Disclaimer:</span> Predictions are for informational purposes and may not fully reflect actual market conditions. Use as a supplementary tool and consult a financial expert for guidance.
  </p>
      </div>
    </footer>}

    </section>
  );
};

export default Dashboard;
