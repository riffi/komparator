import { Fragment, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type HtmlCodeBlockProps = {
  code: string;
  className?: string;
};

export function HtmlCodeBlock({ code, className }: HtmlCodeBlockProps) {
  return (
    <pre
      className={cn(
        "overflow-auto whitespace-pre-wrap rounded-lg border border-border/80 bg-[#050608] p-4 font-mono text-xs leading-6 text-muted",
        className,
      )}
    >
      <code>{renderHtml(code)}</code>
    </pre>
  );
}

function renderHtml(code: string) {
  const blockPattern = /(<(style|script)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderHtmlFragment(code.slice(lastIndex, match.index), `html-${lastIndex}`));
    }

    const [, openTag, blockType, blockContent, closeTag] = match;
    nodes.push(
      <Fragment key={`block-open-${match.index}`}>{renderTag(openTag)}</Fragment>,
      <Fragment key={`block-content-${match.index}`}>
        {blockType.toLowerCase() === "style" ? renderCss(blockContent) : renderJs(blockContent)}
      </Fragment>,
      <Fragment key={`block-close-${match.index}`}>{renderTag(closeTag)}</Fragment>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < code.length) {
    nodes.push(...renderHtmlFragment(code.slice(lastIndex), `html-tail-${lastIndex}`));
  }

  return nodes;
}

function renderHtmlFragment(fragment: string, keyPrefix: string) {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(<!--[\s\S]*?-->)|(<\/?[A-Za-z][^>]*>)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(fragment)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${lastIndex}`}>{fragment.slice(lastIndex, match.index)}</Fragment>,
      );
    }

    const token = match[0];
    nodes.push(
      <Fragment key={`${keyPrefix}-token-${match.index}`}>
        {token.startsWith("<!--") ? renderComment(token) : renderTag(token)}
      </Fragment>,
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < fragment.length) {
    nodes.push(<Fragment key={`${keyPrefix}-tail-${lastIndex}`}>{fragment.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

function renderComment(token: string) {
  return <span className="text-emerald-300/80">{token}</span>;
}

function renderTag(token: string) {
  const match = token.match(/^<(\/?)([^\s/>]+)([\s\S]*?)(\/?)>$/);

  if (!match) {
    return <span className="text-sky-300">{token}</span>;
  }

  const [, closingSlash, tagName, rawAttributes, selfClosingSlash] = match;
  const pieces: ReactNode[] = [
    <span key="open" className="text-sky-300">
      {"<"}
      {closingSlash}
    </span>,
    <span key="name" className="text-violet-300">
      {tagName}
    </span>,
  ];

  if (rawAttributes) {
    pieces.push(...renderAttributes(rawAttributes));
  }

  if (selfClosingSlash) {
    pieces.push(
      <span key="self-closing" className="text-sky-300">
        {selfClosingSlash}
      </span>,
    );
  }

  pieces.push(
    <span key="close" className="text-sky-300">
      {">"}
    </span>,
  );

  return pieces;
}

function renderAttributes(rawAttributes: string) {
  const pieces: ReactNode[] = [];
  const attrPattern = /([^\s=\/]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(rawAttributes)) !== null) {
    if (match.index > lastIndex) {
      pieces.push(
        <Fragment key={`ws-${lastIndex}`}>{rawAttributes.slice(lastIndex, match.index)}</Fragment>,
      );
    }

    const [fullMatch, attrName, attrValuePart] = match;
    const equalsIndex = attrValuePart?.indexOf("=") ?? -1;

    pieces.push(
      <span key={`attr-${match.index}`} className="text-amber-300">
        {attrName}
      </span>,
    );

    if (attrValuePart) {
      const beforeEquals = attrValuePart.slice(0, equalsIndex);
      const afterEquals = attrValuePart.slice(equalsIndex + 1);
      pieces.push(
        <Fragment key={`eq-${match.index}`}>
          {beforeEquals}
          <span className="text-sky-300">=</span>
          <span className="text-emerald-300">{afterEquals}</span>
        </Fragment>,
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < rawAttributes.length) {
    pieces.push(
      <Fragment key={`attr-tail-${lastIndex}`}>{rawAttributes.slice(lastIndex)}</Fragment>,
    );
  }

  return pieces;
}

function renderCss(css: string) {
  const lines = css.split(/\r\n|\r|\n/);

  return lines.map((line, index) => (
    <Fragment key={`css-line-${index}`}>
      {highlightCssLine(line)}
      {index < lines.length - 1 ? "\n" : null}
    </Fragment>
  ));
}

function highlightCssLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return line;
  }

  if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.endsWith("*/")) {
    return <span className="text-emerald-300/80">{line}</span>;
  }

  const braceIndex = line.indexOf("{");
  if (braceIndex !== -1) {
    const selector = line.slice(0, braceIndex);
    const rest = line.slice(braceIndex);
    return (
      <>
        <span className="text-violet-300">{selector}</span>
        <span className="text-sky-300">{rest}</span>
      </>
    );
  }

  const colonIndex = line.indexOf(":");
  if (colonIndex !== -1) {
    const property = line.slice(0, colonIndex);
    const remainder = line.slice(colonIndex + 1);
    const semicolonIndex = remainder.lastIndexOf(";");
    const value = semicolonIndex === -1 ? remainder : remainder.slice(0, semicolonIndex);
    const suffix = semicolonIndex === -1 ? "" : remainder.slice(semicolonIndex);

    return (
      <>
        <span className="text-amber-300">{property}</span>
        <span className="text-sky-300">:</span>
        <span className="text-emerald-300">{value}</span>
        <span className="text-sky-300">{suffix}</span>
      </>
    );
  }

  if (trimmed === "}" || trimmed === "};") {
    return <span className="text-sky-300">{line}</span>;
  }

  return line;
}

function renderJs(script: string) {
  const lines = script.split(/\r\n|\r|\n/);

  return lines.map((line, index) => (
    <Fragment key={`js-line-${index}`}>
      {highlightJsLine(line)}
      {index < lines.length - 1 ? "\n" : null}
    </Fragment>
  ));
}

function highlightJsLine(line: string) {
  const commentIndex = line.indexOf("//");
  const codePart = commentIndex === -1 ? line : line.slice(0, commentIndex);
  const commentPart = commentIndex === -1 ? "" : line.slice(commentIndex);

  const nodes: ReactNode[] = [];
  const tokenPattern =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|async|await|try|catch|finally|import|from|export|default|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(codePart)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`js-text-${lastIndex}`}>{codePart.slice(lastIndex, match.index)}</Fragment>,
      );
    }

    const token = match[0];
    let className = "text-muted";

    if (/^['"`]/.test(token)) {
      className = "text-emerald-300";
    } else if (/^\d/.test(token)) {
      className = "text-orange-300";
    } else {
      className = "text-violet-300";
    }

    nodes.push(
      <span key={`js-token-${match.index}`} className={className}>
        {token}
      </span>,
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < codePart.length) {
    nodes.push(<Fragment key={`js-tail-${lastIndex}`}>{codePart.slice(lastIndex)}</Fragment>);
  }

  if (commentPart) {
    nodes.push(
      <span key="js-comment" className="text-emerald-300/80">
        {commentPart}
      </span>,
    );
  }

  return nodes;
}
