(function () {
  var s = document.currentScript;
  if (!s) return;
  var w = s.getAttribute("data-width") || "400";
  var h = s.getAttribute("data-height") || "500";
  var iframe = document.createElement("iframe");
  iframe.src = "https://gametan.ai/embed/quiz";
  iframe.width = w;
  iframe.height = h;
  iframe.style.border = "none";
  iframe.style.borderRadius = "12px";
  iframe.style.maxWidth = "100%";
  iframe.setAttribute("allow", "autoplay");
  iframe.setAttribute("loading", "lazy");
  iframe.title = "GameTan Quiz";
  s.parentNode.insertBefore(iframe, s);
})();
