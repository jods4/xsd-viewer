const nsResolver = {
  lookupNamespaceURI(prefix: string): string {
    var ns: any = {
      "xs": "http://www.w3.org/2001/XMLSchema"
    };
    return ns[prefix] || null;
  }
};

function xpathMany(context: Node, query: string) {
  let matches = context.ownerDocument.evaluate(query, context, nsResolver, XPathResult.ANY_TYPE, null);
  let result = [];
  let m: Element | undefined;
  while (m = <Element>matches.iterateNext()) result.push(m);
  return result;
}

function xpathOne(context: Node, query: string) {
  return context.ownerDocument
                .evaluate(query, context, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                .singleNodeValue as Element || null;
}

function attr(node: Node, name: string) {
  let a = node.attributes.getNamedItem(name);
  return a && a.value;
}

function loadXsd(uri: string) {
 return fetch(uri)
  .then(r => r.text())
  .then(xml => {
    let parser = new DOMParser();
    let root = parser.parseFromString(xml, "text/xml").documentElement;
    return new Xsd(root);
  });
}

class Xsd {
  rootElements: XsdElement[];
  types = new Map<string, XsdComplexType>();

  constructor(private node: Element) {
    this.rootElements = xpathMany(node, "/xs:schema/xs:element").map(n => new XsdElement(n, this));
  }

  getType(name: string) {
    let result = this.types.get(name);
    if (!result) {
      result = this.createComplexType(name)
            || this.createSimpleType(name);
      this.types.set(name, result);
    }
    return result;
  }

  private createComplexType(name: string) {
    let node = xpathOne(this.node, `//xs:complexType[@name='${name}']`);
    return node && new XsdComplexType(node, this);
  }

  private createSimpleType(name: string) {
    let node = xpathOne(this.node, `//xs:simpleType[@name='${name}']`);
    return node && new XsdSimpleType(node);
  }
}

class XsdElement {
  name: string;
  type: XsdType;
  minOccurs: number;
  maxOccurs: number | "*";

  constructor(node: Element, xsd: Xsd) {
    this.name = attr(node, "name");
    this.minOccurs = parseInt(attr(node, "minOccurs") || "1");
    this.maxOccurs = parseInt(attr(node, "maxOccurs") || "1") || "*";
    this.type = xsd.getType(attr(node, "type"));
  }
}

interface XsdType {
  name: string;
}

class XsdComplexType implements XsdType {
  name: string;
  content: string;

  get children() {
    return xpathMany(this.node, "*/xs:element")
      .map(n => new XsdElement(n, this.xsd));
  }

  constructor(private node: Element, private xsd: Xsd) {
    this.name = attr(node, "name");
    this.content = node.firstElementChild!.localName!;
  }
}

class XsdSimpleType implements XsdType {
  name: string;

  constructor(node: Element) {
    this.name = attr(node, "name");
  }
}