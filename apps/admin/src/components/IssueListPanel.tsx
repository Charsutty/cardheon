import type { GraphIssue } from "../graph/graphTypes";

export function IssueListPanel({ issues, onSelect }: { issues: GraphIssue[]; onSelect: (id: string) => void }) {
  return <section><h3>Issues <span className="count">{issues.length}</span></h3><div className="issue-list">{issues.slice(0, 80).map((issue, index) => <button className={`issue ${issue.severity}`} onClick={() => issue.nodeId && onSelect(issue.nodeId)} key={`${issue.code}:${index}`}><b>{issue.code}</b>{issue.message}</button>)}</div></section>;
}
