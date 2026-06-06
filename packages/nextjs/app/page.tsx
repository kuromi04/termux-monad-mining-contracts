"use client";

import { useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const STANDARDS = ["NI 43-101 (Canadá)", "ECRR 2018 (Colombia)"];
const CATEGORIES = ["INFERRED", "INDICATED", "MEASURED"];
const CATEGORY_BADGE = ["badge-ghost border-slate-700 text-slate-300", "badge-warning border-warning/30", "badge-success border-success/30"];

const Home: NextPage = () => {
  const [lookupId, setLookupId] = useState("1");

  const { data: nextTokenId } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "nextTokenId",
  });

  const { data: cert } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "getCertificate",
    args: [lookupId ? BigInt(lookupId) : undefined],
  });

  const certCategory = cert ? Number(cert.category) : 0;

  return (
    <div className="flex flex-col grow items-center px-4 pt-12 pb-24 bg-slate-950 text-slate-100 min-h-[85vh]">
      {/* Hero Section */}
      <div className="max-w-3xl text-center space-y-4 mb-12">
        <span className="badge badge-emerald badge-outline tracking-wider text-xs uppercase px-3 py-1 font-semibold">
          Monad Testnet
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          ⛏️ Monad Mining Registry
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Immutable digital ledger of mining assets certified under standard compliance frameworks{" "}
          <span className="text-emerald-400 font-semibold">NI 43-101</span> and{" "}
          <span className="text-teal-400 font-semibold">ECRR 2018</span>.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="w-full max-w-xl space-y-6">
        
        {/* Certificate Verification Card */}
        <div className="card bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden shadow-emerald-950/5">
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🔎</span> Verification Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Instantly lookup and verify any registered mining asset certificate by its Token ID.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Token ID</label>
              <input
                className="input input-bordered w-full bg-slate-950/60 border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                type="number"
                min="1"
                placeholder="Enter Token ID (e.g. 1)"
                value={lookupId}
                onChange={e => setLookupId(e.target.value)}
              />
            </div>

            {cert ? (
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-850 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Title ID</span>
                  <span className="text-sm font-bold text-white">{cert.titleId}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Standard</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                    {STANDARDS[Number(cert.standard)]}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Resource Category</span>
                  <span className={`badge ${CATEGORY_BADGE[certCategory]} text-xs font-bold`}>
                    {CATEGORIES[certCategory]}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Cut-off Grade</span>
                  <span className="text-sm font-mono text-slate-200">{cert.cutOffGradeBps?.toString()} bps</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tonnage</span>
                  <span className="text-sm font-mono text-slate-200">{cert.tonnage?.toString()} tons</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Polygon GeoHash</span>
                  <span className="text-xs font-mono text-slate-400">{cert.polygonGeoHash}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Signing QP</span>
                  <Address address={cert.qp} size="sm" />
                </div>

                {/* Visual category progress steps */}
                <div className="pt-4 border-t border-slate-900">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block text-center mb-3">
                    CRIRSCO Classification Level
                  </span>
                  <div className="flex items-center gap-2 justify-center">
                    {CATEGORIES.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                            i <= certCategory
                              ? i === 0
                                ? "bg-slate-700 text-slate-200"
                                : i === 1
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-950 text-slate-600 border border-slate-900 opacity-30"
                          }`}
                        >
                          {c}
                        </span>
                        {i < 2 && <span className="text-slate-800 text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 rounded-2xl p-6 border border-slate-850 text-center">
                <span className="text-2xl block mb-2">🔎</span>
                <p className="text-sm text-slate-550">
                  No certificate exists with Token ID <b>#{lookupId}</b>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info panel/Link to Dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5">
          <div className="text-center sm:text-left">
            <span className="text-xs font-semibold text-slate-400 block">Are you a Qualified Person (QP)?</span>
            <span className="text-[11px] text-slate-555">Access the QP portal to register new assets.</span>
          </div>
          <Link
            href="/dashboard"
            className="btn btn-sm btn-emerald bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-none font-bold rounded-xl px-4"
          >
            Go to QP Dashboard →
          </Link>
        </div>

      </div>

      {/* Footer Meta */}
      <div className="mt-16 text-center space-y-2">
        <p className="text-xs text-slate-600">
          Contract: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-[11px]">0x21d2f82d8aa4e33e55a0b60b12ce0c334c387e6d</code>
        </p>
        <p className="text-xs text-slate-650">
          Total registered assets count: <b>{nextTokenId?.toString() ?? "0"}</b>
        </p>
      </div>
    </div>
  );
};

export default Home;
