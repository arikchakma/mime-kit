import type { Email } from '../parse.ts';

export type ThreadTree = {
  email: Email;
  children: ThreadTree[];
};

function isDescendant(node: ThreadTree, target: ThreadTree): boolean {
  for (const child of node.children) {
    if (child === target || isDescendant(child, target)) {
      return true;
    }
  }
  return false;
}

function byDate(a: ThreadTree, b: ThreadTree): number {
  const da = a.email.date?.getTime() ?? 0;
  const db = b.email.date?.getTime() ?? 0;
  return da - db;
}

export function groupByThread(emails: Email[]): ThreadTree[] {
  const nodes = new Map<string, ThreadTree>();
  const allNodes: ThreadTree[] = [];

  for (const email of emails) {
    const node: ThreadTree = { email, children: [] };
    allNodes.push(node);
    if (email.messageId) {
      nodes.set(email.messageId, node);
    }
  }

  const roots: ThreadTree[] = [];

  for (const node of allNodes) {
    const parentId =
      node.email.inReplyTo ??
      (node.email.references.length > 0
        ? node.email.references[node.email.references.length - 1]
        : undefined);

    const parent = parentId ? nodes.get(parentId) : undefined;

    if (parent && !isDescendant(node, parent)) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.sort(byDate);
  for (const node of nodes.values()) {
    node.children.sort(byDate);
  }

  return roots;
}
