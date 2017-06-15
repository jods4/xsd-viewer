"use strict";
const nsResolver = {
    lookupNamespaceURI(prefix) {
        var ns = {
            "xs": "http://www.w3.org/2001/XMLSchema"
        };
        return ns[prefix] || null;
    }
};
function xpathMany(context, query) {
    let matches = context.ownerDocument.evaluate(query, context, nsResolver, XPathResult.ANY_TYPE, null);
    let result = [];
    let m;
    while (m = matches.iterateNext())
        result.push(m);
    return result;
}
function xpathOne(context, query) {
    return context.ownerDocument
        .evaluate(query, context, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue || null;
}
function attr(node, name) {
    let a = node.attributes.getNamedItem(name);
    return a && a.value;
}
function loadXsd(uri) {
    return fetch(uri)
        .then(r => r.text())
        .then(xml => {
        let parser = new DOMParser();
        let root = parser.parseFromString(xml, "text/xml").documentElement;
        return new Xsd(root);
    });
}
class Xsd {
    constructor(node) {
        this.node = node;
        this.types = new Map();
        this.rootElements = xpathMany(node, "/xs:schema/xs:element").map(n => new XsdElement(n, this));
    }
    getType(name) {
        let result = this.types.get(name);
        if (!result) {
            result = this.createComplexType(name)
                || this.createSimpleType(name);
            this.types.set(name, result);
        }
        return result;
    }
    createComplexType(name) {
        let node = xpathOne(this.node, `//xs:complexType[@name='${name}']`);
        return node && new XsdComplexType(node, this);
    }
    createSimpleType(name) {
        let node = xpathOne(this.node, `//xs:simpleType[@name='${name}']`);
        return node && new XsdSimpleType(node);
    }
}
class XsdElement {
    constructor(node, xsd) {
        this.name = attr(node, "name");
        this.minOccurs = parseInt(attr(node, "minOccurs") || "1");
        this.maxOccurs = parseInt(attr(node, "maxOccurs") || "1") || "*";
        this.type = xsd.getType(attr(node, "type"));
    }
}
class XsdComplexType {
    constructor(node, xsd) {
        this.node = node;
        this.xsd = xsd;
        this.name = attr(node, "name");
        this.content = node.firstElementChild.localName;
    }
    get children() {
        return xpathMany(this.node, "*/xs:element")
            .map(n => new XsdElement(n, this.xsd));
    }
}
class XsdSimpleType {
    constructor(node) {
        this.name = attr(node, "name");
    }
}
const elementTemplate = document.getElementById("xsd-element");
function printElement(e) {
    let dom = document.importNode(elementTemplate.content, true);
    dom.querySelector(".xsd-element")["xsdElement"] = e;
    dom.querySelector(".xsd-name").textContent = e.name;
    dom.querySelector(".xsd-type").textContent = e.type.name;
    if (e.minOccurs === 0)
        dom.querySelector(".xsd-element").classList.add("xsd-optional");
    if (e.minOccurs !== 1 || e.maxOccurs !== 1)
        dom.querySelector(".xsd-name").innerHTML += `<span class=xsd-occurs>${e.minOccurs}..${e.maxOccurs}</span>`;
    if (e.type instanceof XsdSimpleType)
        dom.querySelector(".xsd-element").classList.remove("xsd-expandable");
    else if (e.type instanceof XsdComplexType)
        dom.querySelector(".xsd-content").textContent = e.type.content;
    return dom;
}
loadXsd("pain.001.001.08.xsd")
    .then(xsd => {
    document.body.innerHTML = "";
    for (let x of xsd.rootElements)
        document.body.appendChild(printElement(x));
});
window.addEventListener("click", e => {
    let element = e.target;
    if (!element.matches(".xsd-expandable > .xsd-main > .xsd-header > *, .xsd-expandable > .xsd-main > .xsd-header"))
        return;
    let parent = element.parentElement;
    while (!parent.classList.contains("xsd-expandable"))
        parent = parent.parentElement;
    if (parent.classList.contains("xsd-expanded")) {
        parent.classList.remove("xsd-expanded");
        [].forEach.call(parent.querySelectorAll(".xsd-main > :not(.xsd-header)"), (child) => child.remove());
    }
    else {
        parent.classList.add("xsd-expanded");
        let x = parent["xsdElement"];
        for (let child of x.type.children)
            parent.querySelector(".xsd-main").appendChild(printElement(child));
    }
});
