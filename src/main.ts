loadXsd("pain.001.001.08.xsd")
.then(xsd => {
  document.body.innerHTML = "";
  for (let x of xsd.rootElements)
    document.body.appendChild(printElement(x));
});

window.addEventListener("click", e => {
  let element = e.target as HTMLElement;
  if (!element.matches(".xsd-expandable > .xsd-main > .xsd-header > *, .xsd-expandable > .xsd-main > .xsd-header")) return;
  let parent = element.parentElement!;
  while (!parent.classList.contains("xsd-expandable")) parent = parent.parentElement!;
  if (parent.classList.contains("xsd-expanded")) {
    parent.classList.remove("xsd-expanded");
    [].forEach.call(parent.querySelectorAll(".xsd-main > :not(.xsd-header)")!,
      (child: HTMLElement) => child.remove());
  }
  else {
    parent.classList.add("xsd-expanded");
    let x = parent["xsdElement"];
    for (let child of x.type.children)
      parent.querySelector(".xsd-main")!.appendChild(printElement(child));
  }
});