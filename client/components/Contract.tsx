"use client";

import { useState, useCallback, useEffect } from "react";
import {
  createLoan,
  fundLoan,
  repayLoan,
  getLoan,
  getAllLoans,
  getBorrowerLoans,
  getLenderLoans,
  initContract,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

function BanknoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12a2 2 0 0 0 2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2" />
      <path d="M22 12a2 2 0 0 1-2 2h-1a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2v4a2 2 0 0 0 2 2h6" />
      <circle cx="6" cy="19" r="2" />
      <path d="M10 19h4" />
      <path d="M14 15v4" />
      <path d="M17 17h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2" />
      <path d="M7 15h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Status Config ────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; variant: "success" | "warning" | "info" | "default" }> = {
  active: { color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10", border: "border-[#fbbf24]/20", dot: "bg-[#fbbf24]", variant: "warning" },
  funded: { color: "text-[#4fc3f7]", bg: "bg-[#4fc3f7]/10", border: "border-[#4fc3f7]/20", dot: "bg-[#4fc3f7]", variant: "info" },
  repaid: { color: "text-[#34d399]", bg: "bg-[#34d399]/10", border: "border-[#34d399]/20", dot: "bg-[#34d399]", variant: "success" },
};

// ── Types ────────────────────────────────────────────────────

interface LoanData {
  borrower: string;
  amount: string;
  interest_rate: number;
  duration: number;
  purpose: string;
  funded_amount: string;
  repaid_amount: string;
  status: string;
}

// ── Main Component ───────────────────────────────────────────

type Tab = "browse" | "create" | "fund" | "repay";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Create loan state
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("500"); // 5%
  const [duration, setDuration] = useState("30"); // days
  const [purpose, setPurpose] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fund/Repay state
  const [loanId, setLoanId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);

  // Browse state
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [loans, setLoans] = useState<{id: number; data: LoanData}[]>([]);

  const truncate = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  // Load loans on mount
  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setIsLoadingLoans(true);
    try {
      const loanIds = await getAllLoans();
      if (Array.isArray(loanIds)) {
        const loanData = await Promise.all(
          loanIds.map(async (id: number) => {
            const data = await getLoan(id);
            return { id, data: data as LoanData | null };
          })
        );
        setLoans(loanData.filter(l => l.data !== null) as {id: number; data: LoanData}[]);
      }
    } catch (err) {
      console.error("Failed to load loans:", err);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  const handleCreateLoan = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!amount || !purpose) return setError("Fill in all fields");
    setError(null);
    setIsCreating(true);
    setTxStatus("Awaiting signature...");
    try {
      await initContract(walletAddress);
      const loanId = await createLoan(
        walletAddress,
        BigInt(amount),
        parseInt(interestRate) || 500,
        parseInt(duration) || 30,
        purpose
      );
      setTxStatus(`Loan created! ID: ${loanId}`);
      setAmount("");
      setPurpose("");
      loadLoans();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCreating(false);
    }
  }, [walletAddress, amount, interestRate, duration, purpose]);

  const handleFundLoan = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!loanId || !fundAmount) return setError("Fill in all fields");
    setError(null);
    setIsFunding(true);
    setTxStatus("Awaiting signature...");
    try {
      await fundLoan(walletAddress, parseInt(loanId), BigInt(fundAmount));
      setTxStatus("Loan funded successfully!");
      setLoanId("");
      setFundAmount("");
      loadLoans();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsFunding(false);
    }
  }, [walletAddress, loanId, fundAmount]);

  const handleRepayLoan = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!loanId || !fundAmount) return setError("Fill in all fields");
    setError(null);
    setIsRepaying(true);
    setTxStatus("Awaiting signature...");
    try {
      await repayLoan(walletAddress, parseInt(loanId), BigInt(fundAmount));
      setTxStatus("Loan repaid successfully!");
      setLoanId("");
      setFundAmount("");
      loadLoans();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsRepaying(false);
    }
  }, [walletAddress, loanId, fundAmount]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "browse", label: "Browse", icon: <SearchIcon />, color: "#4fc3f7" },
    { key: "create", label: "Borrow", icon: <WalletIcon />, color: "#7c6cf0" },
    { key: "fund", label: "Lend", icon: <BanknoteIcon />, color: "#34d399" },
    { key: "repay", label: "Repay", icon: <RefreshIcon />, color: "#fbbf24" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("success") || txStatus.includes("created") || txStatus.includes("funded") || txStatus.includes("repaid") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#34d399]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#34d399]">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">P2P Lending</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Browse */}
            {activeTab === "browse" && (
              <div className="space-y-4">
                <MethodSignature name="get_all_loans" params="()" returns="-> Vec<u32>" color="#4fc3f7" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">{loans.length} loans available</span>
                  <button onClick={loadLoans} className="text-xs text-[#4fc3f7] hover:underline flex items-center gap-1">
                    <RefreshIcon /> Refresh
                  </button>
                </div>
                
                {isLoadingLoans ? (
                  <div className="text-center py-8 text-white/30">
                    <SpinnerIcon />
                    <p className="mt-2 text-xs">Loading loans...</p>
                  </div>
                ) : loans.length === 0 ? (
                  <div className="text-center py-8 text-white/30 border border-white/[0.04] rounded-xl">
                    <p className="text-xs">No loans yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {loans.map(({ id, data }) => {
                      const status = data.status || "active";
                      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
                      const progress = data.funded_amount && data.amount 
                        ? (parseInt(data.funded_amount) / parseInt(data.amount)) * 100 
                        : 0;
                      return (
                        <div key={id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 animate-fade-in-up">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm text-white/80">Loan #{id}</span>
                            <Badge variant={cfg.variant}>
                              <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", cfg.dot)} />
                              {status}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/35">Purpose</span>
                              <span className="text-white/70">{data.purpose}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/35">Amount</span>
                              <span className="text-white/70 font-mono">{data.amount} XLM</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/35">Interest</span>
                              <span className="text-white/70">{data.interest_rate / 100}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/35">Duration</span>
                              <span className="text-white/70">{data.duration} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/35">Funded</span>
                              <span className="text-white/70">{data.funded_amount} / {data.amount} XLM</span>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#4fc3f7] to-[#34d399] transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Create Loan */}
            {activeTab === "create" && (
              <div className="space-y-5">
                <MethodSignature name="create_loan" params="(amount, rate, duration, purpose)" color="#7c6cf0" />
                <Input 
                  label="Amount (XLM)" 
                  type="number"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="1000" 
                />
                <Input 
                  label="Interest Rate (bps, 500 = 5%)" 
                  type="number"
                  value={interestRate} 
                  onChange={(e) => setInterestRate(e.target.value)} 
                  placeholder="500" 
                />
                <Input 
                  label="Duration (days)" 
                  type="number"
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)} 
                  placeholder="30" 
                />
                <Input 
                  label="Purpose" 
                  value={purpose} 
                  onChange={(e) => setPurpose(e.target.value)} 
                  placeholder="Business, personal, etc." 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleCreateLoan} disabled={isCreating} shimmerColor="#7c6cf0" className="w-full">
                    {isCreating ? <><SpinnerIcon /> Creating...</> : <><WalletIcon /> Create Loan Request</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to create loan
                  </button>
                )}
              </div>
            )}

            {/* Fund Loan */}
            {activeTab === "fund" && (
              <div className="space-y-5">
                <MethodSignature name="fund_loan" params="(loan_id, amount)" color="#34d399" />
                <Input 
                  label="Loan ID" 
                  type="number"
                  value={loanId} 
                  onChange={(e) => setLoanId(e.target.value)} 
                  placeholder="1" 
                />
                <Input 
                  label="Amount (XLM)" 
                  type="number"
                  value={fundAmount} 
                  onChange={(e) => setFundAmount(e.target.value)} 
                  placeholder="100" 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleFundLoan} disabled={isFunding} shimmerColor="#34d399" className="w-full">
                    {isFunding ? <><SpinnerIcon /> Funding...</> : <><BanknoteIcon /> Fund Loan</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to fund loan
                  </button>
                )}
              </div>
            )}

            {/* Repay Loan */}
            {activeTab === "repay" && (
              <div className="space-y-5">
                <MethodSignature name="repay_loan" params="(loan_id, amount)" color="#fbbf24" />
                <Input 
                  label="Loan ID" 
                  type="number"
                  value={loanId} 
                  onChange={(e) => setLoanId(e.target.value)} 
                  placeholder="1" 
                />
                <Input 
                  label="Amount (XLM)" 
                  type="number"
                  value={fundAmount} 
                  onChange={(e) => setFundAmount(e.target.value)} 
                  placeholder="1050 (with interest)" 
                />
                <p className="text-xs text-white/25">Enter the full amount with interest to mark as repaid.</p>
                {walletAddress ? (
                  <ShimmerButton onClick={handleRepayLoan} disabled={isRepaying} shimmerColor="#fbbf24" className="w-full">
                    {isRepaying ? <><SpinnerIcon /> Repaying...</> : <><RefreshIcon /> Repay Loan</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to repay loan
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">P2P Lending &middot; Soroban</p>
            <div className="flex items-center gap-2">
              {["active", "funded", "repaid"].map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cn("h-1 w-1 rounded-full", STATUS_CONFIG[s]?.dot ?? "bg-white/20")} />
                  <span className="font-mono text-[9px] text-white/15 capitalize">{s}</span>
                  {i < 2 && <span className="text-white/10 text-[8px]">&rarr;</span>}
                </span>
              ))}
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
