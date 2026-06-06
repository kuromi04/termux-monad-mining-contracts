"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address, AddressInput, Balance } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";

const STANDARDS = ["NI 43-101 (Canadá)", "ECRR 2018 (Colombia)"];
const CATEGORIES = ["INFERRED", "INDICATED", "MEASURED"];
const CATEGORY_BADGE = ["badge-ghost", "badge-warning", "badge-success"];

interface Certificate {
  tokenId: number;
  titleId: string;
  standard: number;
  category: number;
  cutOffGradeBps: bigint;
  tonnage: bigint;
  polygonGeoHash: string;
  qp: string;
  updatedAt: bigint;
}

const Dashboard: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- Profile / Querying States ---
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);

  // --- Registration Form States ---
  const [titleId, setTitleId] = useState("");
  const [standard, setStandard] = useState(0);
  const [category, setCategory] = useState(0);
  const [cutOff, setCutOff] = useState("");
  const [tonnage, setTonnage] = useState("");
  const [geoHash, setGeoHash] = useState("");

  // --- Admin Form States ---
  const [newQPAddress, setNewQPAddress] = useState("");
  const [adminStandard, setAdminStandard] = useState(0);

  // --- Contract Reads ---
  const { data: nextTokenId, refetch: refetchNextTokenId } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "nextTokenId",
  });

  const { data: isQP } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "whitelistedQP",
    args: [connectedAddress],
  });

  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "owner",
  });

  const { data: miningRegistryContract } = useScaffoldContract({
    contractName: "MiningRegistry",
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "MiningRegistry",
  });

  // Client-side certificates querying loop
  useEffect(() => {
    let isMounted = true;
    const fetchCertificates = async () => {
      if (!miningRegistryContract || nextTokenId === undefined) return;
      setIsLoadingCerts(true);
      const list: Certificate[] = [];
      const limit = Number(nextTokenId);

      for (let i = 1; i <= limit; i++) {
        try {
          const cert = await miningRegistryContract.read.getCertificate([BigInt(i)]);
          if (cert && isMounted) {
            list.push({
              tokenId: i,
              titleId: cert.titleId,
              standard: Number(cert.standard),
              category: Number(cert.category),
              cutOffGradeBps: cert.cutOffGradeBps,
              tonnage: cert.tonnage,
              polygonGeoHash: cert.polygonGeoHash,
              qp: cert.qp,
              updatedAt: cert.updatedAt,
            });
          }
        } catch (e) {
          // Gracefully skip tokens that do not exist or reverted
        }
      }
      if (isMounted) {
        setCerts(list);
        setIsLoadingCerts(false);
      }
    };

    fetchCertificates();
    return () => {
      isMounted = false;
    };
  }, [miningRegistryContract, nextTokenId, refreshTrigger]);

  const safeBig = (v: string) => {
    try {
      return BigInt(v || "0");
    } catch {
      return 0n;
    }
  };

  // Validations
  const isTonnageValid = tonnage && Number(tonnage) > 0;
  const isCutOffValid = cutOff && Number(cutOff) >= 0;
  const isTitleIdValid = titleId.trim() !== "";
  const isGeoHashValid = geoHash.trim() !== "";
  const isFormValid = isTonnageValid && isCutOffValid && isTitleIdValid && isGeoHashValid;

  const isAdminValid = newQPAddress && newQPAddress.trim() !== "";

  // Write Actions
  const handleRegister = async () => {
    if (!isFormValid) return;
    try {
      await writeContractAsync({
        functionName: "registerCertificate",
        args: [titleId, standard, category, safeBig(cutOff), safeBig(tonnage), geoHash],
      });
      setTitleId("");
      setCutOff("");
      setTonnage("");
      setGeoHash("");
      await refetchNextTokenId();
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error("Error registering certificate:", e);
    }
  };

  const handleAdvance = async (tokenId: number, currentCategory: number) => {
    if (currentCategory >= 2) return;
    try {
      await writeContractAsync({
        functionName: "advanceCategory",
        args: [BigInt(tokenId), currentCategory + 1],
      });
      await refetchNextTokenId();
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error("Error advancing category:", e);
    }
  };

  const handleWhitelist = async () => {
    if (!isAdminValid) return;
    try {
      await writeContractAsync({
        functionName: "whitelistQP",
        args: [newQPAddress],
      });
      setNewQPAddress("");
    } catch (e) {
      console.error("Error whitelisting QP:", e);
    }
  };

  // Filter QP certificates
  const qpCerts = certs.filter(c => c.qp.toLowerCase() === connectedAddress?.toLowerCase());
  const isOwner = connectedAddress && ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();

  // Role-based Access Control
  if (connectedAddress && !isQP && !isOwner) {
    return (
      <div className="flex flex-col grow items-center justify-center px-5 py-20 bg-slate-950 text-white min-h-[80vh]">
        <div className="card w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-red-500/30 shadow-2xl p-8 rounded-2xl text-center shadow-red-950/20">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 animate-pulse">
              <span className="text-4xl">⚠️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your wallet address is not authorized in the Mining Registry. You must be a whitelisted Qualified Person (QP) or the contract Owner to access this dashboard.
          </p>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-left mb-6">
            <span className="text-xs text-slate-500 block mb-1">Your Wallet Address</span>
            <Address address={connectedAddress} />
          </div>
          <a
            href="/"
            className="btn btn-outline border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white rounded-full w-full transition-all duration-300"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  if (!connectedAddress) {
    return (
      <div className="flex flex-col grow items-center justify-center px-5 py-20 bg-slate-950 text-white min-h-[80vh]">
        <div className="card w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl p-8 rounded-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
              <span className="text-4xl">🔌</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-200 mb-2">Connect Wallet</h2>
          <p className="text-slate-400 text-sm mb-4">
            Please connect your Web3 wallet to access the Qualified Person (QP) dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-3xl">🛡️</span> QP Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Authorized interface for resource registry & categorization.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Monad Testnet</span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Card + Admin Panel */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Whitelist Status Profile Card */}
            {isQP && (
              <div className="card bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden shadow-emerald-950/10">
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                    <span>👤</span> Whitelist Profile
                  </h3>
                  <span className="badge badge-success border-emerald-500/30 shadow-[0_0_10px_rgba(52,238,182,0.2)] text-xs font-semibold py-1 animate-pulse">
                    ACTIVE QP
                  </span>
                </div>
                <div className="p-6 space-y-6">
                  {/* Address Display */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium block">Authorized Address</span>
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850">
                      <Address address={connectedAddress} />
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium block">Wallet Balance</span>
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850 flex justify-between items-center">
                      <Balance address={connectedAddress} className="text-sm text-slate-200" />
                    </div>
                  </div>

                  {/* Standards & Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-center">
                      <span className="text-2xl block mb-1">📋</span>
                      <span className="text-xs text-slate-400 block mb-1">Standards</span>
                      <div className="flex flex-col gap-1 justify-center items-center">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">NI 43-101</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">ECRR 2018</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-center flex flex-col justify-center items-center">
                      <span className="text-2xl block mb-1">✍️</span>
                      <span className="text-xs text-slate-400 block mb-1">Signed Certs</span>
                      {isLoadingCerts ? (
                        <span className="loading loading-spinner loading-xs text-slate-500" />
                      ) : (
                        <span className="text-xl font-bold text-white">{qpCerts.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Owner-only Admin Panel */}
            {isOwner && (
              <div className="card bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden shadow-blue-950/10">
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-blue-400 flex items-center gap-2">
                    <span>⚙️</span> Owner Administration
                  </h3>
                  <span className="badge badge-info text-xs font-semibold py-1">
                    CONTRACT OWNER
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Whitelist a new Qualified Person (QP) to grant them certificate registration and advancement permissions.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">QP Wallet Address</label>
                    <AddressInput
                      value={newQPAddress}
                      placeholder="0x..."
                      onChange={val => setNewQPAddress(val)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Default Compliance Standard</label>
                    <select
                      className="select select-bordered w-full bg-slate-950 border-slate-800 text-sm focus:outline-none rounded-xl"
                      value={adminStandard}
                      onChange={e => setAdminStandard(Number(e.target.value))}
                    >
                      {STANDARDS.map((s, i) => (
                        <option key={i} value={i}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn btn-info w-full mt-2 rounded-xl text-white font-semibold transition-all duration-300"
                    disabled={isMining || !isAdminValid}
                    onClick={handleWhitelist}
                  >
                    {isMining ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Whitelist QP"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Certificate Registration Form */}
          <div className="lg:col-span-2 space-y-8">
            {isQP ? (
              <div className="card bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-950 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span>✍️</span> Register Mining Asset Certificate
                  </h3>
                  <span className="text-xs text-slate-500">Creates an immutable NFT record</span>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Grid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Title ID</label>
                      <input
                        className="input input-bordered w-full bg-slate-950/60 border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. CO-2026-LITIO-001"
                        value={titleId}
                        onChange={e => setTitleId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Polygon GeoHash</label>
                      <input
                        className="input input-bordered w-full bg-slate-950/60 border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. d2g6f8q9b"
                        value={geoHash}
                        onChange={e => setGeoHash(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Standard</label>
                      <select
                        className="select select-bordered w-full bg-slate-950/60 border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                        value={standard}
                        onChange={e => setStandard(Number(e.target.value))}
                      >
                        {STANDARDS.map((s, i) => (
                          <option key={i} value={i}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Initial Category</label>
                      <select
                        className="select select-bordered w-full bg-slate-950/60 border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                        value={category}
                        onChange={e => setCategory(Number(e.target.value))}
                      >
                        {CATEGORIES.map((c, i) => (
                          <option key={i} value={i}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cut-off Grade (bps)</label>
                      <input
                        type="number"
                        min="0"
                        className="input input-bordered w-full bg-slate-950/60 border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. 50"
                        value={cutOff}
                        onChange={e => setCutOff(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tonnage (tons)</label>
                      <input
                        type="number"
                        min="1"
                        className="input input-bordered w-full bg-slate-950/60 border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. 1000000"
                        value={tonnage}
                        onChange={e => setTonnage(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    className="btn btn-emerald w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold tracking-wide rounded-xl border-none shadow-[0_4px_20px_rgba(16,185,129,0.2)] disabled:bg-slate-800 disabled:text-slate-500 transition-all duration-350"
                    disabled={isMining || !isFormValid}
                    onClick={handleRegister}
                  >
                    {isMining ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Sign & Register Certificate"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-2xl text-center flex flex-col justify-center items-center h-full">
                <span className="text-4xl mb-3">🛠️</span>
                <h3 className="text-xl font-bold text-slate-300">Contract Owner Dashboard</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  You are connected as the contract owner. You can use the whitelist panel on the left to authorize QPs. Registering certificates requires a whitelisted QP role.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Full-width Resource Escalator Table */}
        {isQP && (
          <div className="card bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span>📈</span> Resource Category Escalator
              </h3>
              <span className="text-xs text-slate-500">Manage category upgrades for your signed certificates</span>
            </div>
            
            <div className="p-6">
              {isLoadingCerts ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <span className="loading loading-spinner loading-md text-emerald-500" />
                  <span className="text-sm text-slate-500">Querying smart contract data...</span>
                </div>
              ) : qpCerts.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-2">📂</span>
                  <p className="text-slate-400 text-sm">No certificates signed by this QP address found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4 font-bold">Token ID</th>
                        <th className="py-3 px-4 font-bold">Title ID</th>
                        <th className="py-3 px-4 font-bold">Standard</th>
                        <th className="py-3 px-4 font-bold">Cut-off (bps)</th>
                        <th className="py-3 px-4 font-bold">Tonnage</th>
                        <th className="py-3 px-4 font-bold">GeoHash</th>
                        <th className="py-3 px-4 font-bold text-center">Category Steps</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {qpCerts.map(cert => {
                        return (
                          <tr key={cert.tokenId} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-4 px-4 font-semibold text-emerald-400">#{cert.tokenId}</td>
                            <td className="py-4 px-4 font-medium text-white">{cert.titleId}</td>
                            <td className="py-4 px-4">
                              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                {cert.standard === 0 ? "NI 43-101" : "ECRR 2018"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-300">{cert.cutOffGradeBps.toString()}</td>
                            <td className="py-4 px-4 text-slate-300">{cert.tonnage.toString()}</td>
                            <td className="py-4 px-4 font-mono text-xs text-slate-400">{cert.polygonGeoHash}</td>
                            
                            {/* Category Escalator Steps */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5 justify-center">
                                {CATEGORIES.map((catName, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        idx <= cert.category
                                          ? idx === 0
                                            ? "bg-slate-700 text-slate-200"
                                            : idx === 1
                                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                          : "bg-slate-950 text-slate-600 border border-slate-900"
                                      }`}
                                    >
                                      {catName}
                                    </span>
                                    {idx < 2 && <span className="text-slate-700 text-xs">→</span>}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Action Button */}
                            <td className="py-4 px-4 text-right">
                              {cert.category >= 2 ? (
                                <span className="text-xs text-emerald-500 font-semibold">✓ Max Level</span>
                              ) : (
                                <button
                                  className="btn btn-xs btn-outline border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all rounded"
                                  disabled={isMining}
                                  onClick={() => handleAdvance(cert.tokenId, cert.category)}
                                >
                                  {isMining ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    `Escalate to ${CATEGORIES[cert.category + 1]}`
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
