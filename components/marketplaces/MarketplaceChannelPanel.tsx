"use client";

import { useCallback, useEffect, useState } from "react";
import type { Marketplace } from "@/app/generated/prisma/enums";
import type { MarketplaceChannelView } from "@/lib/marketplaces/types";

type Props = { productId: number };

export function MarketplaceChannelPanel({ productId }: Props) {
  const [channels, setChannels] = useState<MarketplaceChannelView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingMarketplace, setSavingMarketplace] =
    useState<Marketplace | null>(null);
  const [error, setError] = useState("");

  const loadChannels = useCallback(async () => {
    const response = await fetch(`/api/products/${productId}/marketplaces`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "판매 채널 상태를 불러오지 못했습니다.");
    }
    setChannels(data.channels);
  }, [productId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        await loadChannels();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "판매 채널 상태를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadChannels]);

  async function updateSelection(
    marketplace: Marketplace,
    selected: boolean,
  ) {
    setSavingMarketplace(marketplace);
    setError("");
    try {
      const response = await fetch(
        `/api/products/${productId}/marketplaces/${marketplace.toLowerCase()}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "판매 채널 선택을 저장하지 못했습니다.");
      }
      await loadChannels();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "판매 채널 선택을 저장하지 못했습니다.",
      );
    } finally {
      setSavingMarketplace(null);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
        <h2 className="text-xl font-semibold text-slate-950">판매 채널</h2>
        <p className="mt-1 text-sm text-slate-500">
          마켓별 선택 상태와 등록 준비 상태를 확인합니다.
        </p>
      </div>

      <div className="p-5 sm:p-7">
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">판매 채널을 불러오는 중입니다.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel) => (
              <MarketplaceChannelCard
                key={channel.marketplace}
                channel={channel}
                isSaving={savingMarketplace === channel.marketplace}
                onSelectionChange={(selected) =>
                  updateSelection(channel.marketplace, selected)
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MarketplaceChannelCard({
  channel,
  isSaving,
  onSelectionChange,
}: {
  channel: MarketplaceChannelView;
  isSaving: boolean;
  onSelectionChange: (selected: boolean) => void;
}) {
  return (
    <article className="flex min-h-72 flex-col rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{channel.label}</h3>
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              channel.selected
                ? "bg-blue-100 text-blue-800"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {channel.selected ? "선택됨" : "미선택"}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-600">
          {channel.statusLabel}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <InfoRow label="readiness" value={channel.readinessMessage} />
        <InfoRow label="확정 판매가" value={formatMoney(channel.finalSalePrice)} />
        <InfoRow
          label="추천 판매가"
          value={
            channel.recommendedSalePrice === null
              ? "계산 설정 없음"
              : formatMoney(channel.recommendedSalePrice)
          }
        />
        <InfoRow
          label="마지막 전송 재고"
          value={
            channel.lastSentStock === null
              ? "-"
              : `${channel.lastSentStock.toLocaleString("ko-KR")}개`
          }
        />
        {channel.marketplaceProductId && (
          <InfoRow label="마켓 상품 ID" value={channel.marketplaceProductId} />
        )}
      </dl>

      {!channel.adapterAvailable && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          아직 연동되지 않은 마켓입니다.
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <button
          type="button"
          disabled={isSaving || (channel.selected && !channel.canDisable)}
          onClick={() => onSelectionChange(!channel.selected)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "저장 중..." : channel.selected ? "선택 해제" : "선택"}
        </button>
        {channel.marketplace === "COUPANG" && (
          <a
            href="#coupang-registration"
            className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            쿠팡 설정
          </a>
        )}
      </div>

      {channel.selected && !channel.canDisable && (
        <p className="mt-3 text-xs text-slate-500">
          등록 중이거나 등록된 채널은 여기서 선택 해제할 수 없습니다.
        </p>
      )}
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="break-all text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function formatMoney(value: number | null) {
  return value === null ? "미확정" : `${value.toLocaleString("ko-KR")}원`;
}
