const CSS_TO_SVG_ATTR: Record<string, string> = {
  fill: 'fill',
  'fill-rule': 'fillRule',
  'clip-path': 'clipPath',
  stroke: 'stroke',
  'stroke-width': 'strokeWidth',
  opacity: 'opacity',
};

function parseClassRules(styleContent: string): Map<string, Record<string, string>> {
  const classRules = new Map<string, Record<string, string>>();
  const ruleRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/g;
  let match = ruleRegex.exec(styleContent);

  while (match) {
    const className = match[1];
    const existing = classRules.get(className) ?? {};

    match[2].split(';').forEach((decl) => {
      const colonIndex = decl.indexOf(':');
      if (colonIndex === -1) return;
      const key = decl.slice(0, colonIndex).trim();
      const value = decl.slice(colonIndex + 1).trim();
      if (key && value) {
        existing[key] = value;
      }
    });

    classRules.set(className, existing);
    match = ruleRegex.exec(styleContent);
  }

  return classRules;
}

function applyClassRulesToAttributes(
  attrs: string,
  classNames: string,
  classRules: Map<string, Record<string, string>>,
): string {
  let nextAttrs = attrs;

  classNames.trim().split(/\s+/).forEach((className) => {
    const rules = classRules.get(className);
    if (!rules) return;

    Object.entries(rules).forEach(([cssProp, value]) => {
      const svgAttr = CSS_TO_SVG_ATTR[cssProp];
      if (!svgAttr) return;

      const attrPattern = new RegExp(`\\b${svgAttr}=`, 'i');
      if (attrPattern.test(nextAttrs)) return;

      nextAttrs += ` ${svgAttr}="${value}"`;
    });
  });

  return nextAttrs.replace(/\sclass=(["'])[^"']*\1/, '').trim();
}

/** react-native-svg ignores `<style>` blocks; inline class rules onto SVG elements. */
export function inlineSvgStyles(svg: string): string {
  const styleMatch = svg.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (!styleMatch) return svg;

  const classRules = parseClassRules(styleMatch[1]);
  if (classRules.size === 0) return svg.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  const withoutStyle = svg.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  return withoutStyle.replace(
    /<([a-zA-Z]+)([^>]*?)\sclass=(["'])([^"']+)\3([^>]*?)(\/?)>/g,
    (_full, tag, before, _quote, classNames, after, selfClose) => {
      const mergedAttrs = applyClassRulesToAttributes(`${before}${after}`, classNames, classRules);
      const suffix = selfClose ? ' /' : '';
      return mergedAttrs
        ? `<${tag} ${mergedAttrs}${suffix}>`
        : `<${tag}${suffix}>`;
    },
  );
}
