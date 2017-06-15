const elementTemplate = document.getElementById("xsd-element") as HTMLTemplateElement;

function printElement(e: XsdElement): DocumentFragment {
  let dom = document.importNode(elementTemplate.content, true);

  dom.querySelector(".xsd-element")!["xsdElement"] = e;
  dom.querySelector(".xsd-name")!.textContent = e.name;
  dom.querySelector(".xsd-type")!.textContent = e.type.name;
  if (e.minOccurs === 0)
    dom.querySelector(".xsd-element")!.classList.add("xsd-optional");
  if (e.minOccurs !== 1 || e.maxOccurs !== 1)
    dom.querySelector(".xsd-name")!.innerHTML += `<span class=xsd-occurs>${e.minOccurs}..${e.maxOccurs}</span>`;
  if (e.type instanceof XsdSimpleType)
    dom.querySelector(".xsd-element")!.classList.remove("xsd-expandable");
  else if (e.type instanceof XsdComplexType)
    dom.querySelector(".xsd-content")!.textContent = e.type.content;

  return dom;
}