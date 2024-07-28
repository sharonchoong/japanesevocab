$("[data-mobile-app-toggle] .button").on("click", function () {
  $(this).siblings().removeClass("is-active");
  $(this).addClass("is-active");
});

kofiWidgetOverlay.draw("sharonchoong", {
  type: "floating-chat",
  "floating-chat.donateButton.text": "Support me",
  "floating-chat.donateButton.background-color": "#00b9fe",
  "floating-chat.donateButton.text-color": "#fff",
});