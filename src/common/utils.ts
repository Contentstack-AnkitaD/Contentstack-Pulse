import UiLocation from "@contentstack/app-sdk/dist/src/uiLocation";
import { get, isEmpty, keys } from "lodash";

export function getAppLocation(sdk: UiLocation): string {
  const locations = keys(sdk?.location);
  let locationName = "";
  for (let i = 0; i <= locations.length; i++) {
    if (!isEmpty(get(sdk, `location.${locations[i]}`, undefined))) {
      locationName = locations[i];
      break;
    }
  }
  return locationName;
}

export function getScoreColor(score: number): string {
  if (score <= 40) return "#e74c3c";
  if (score <= 70) return "#f39c12";
  return "#27ae60";
}

export function getScoreLabel(score: number): string {
  if (score <= 40) return "Critical";
  if (score <= 70) return "Needs Work";
  return "Healthy";
}

export function getScoreBgClass(score: number): string {
  if (score <= 40) return "pulse-score--critical";
  if (score <= 70) return "pulse-score--warning";
  return "pulse-score--healthy";
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
