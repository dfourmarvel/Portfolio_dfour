const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

if (filterButtons.length && projectCards.length) {
  const setActiveFilter = (selectedButton) => {
    filterButtons.forEach((button) => {
      const isActive = button === selectedButton;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  const applyProjectFilter = (filterValue) => {
    projectCards.forEach((card) => {
      const categories = (card.getAttribute("data-category") || "").split(" ");
      const shouldShow = filterValue === "all" || categories.includes(filterValue);
      card.hidden = !shouldShow;
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filterValue = button.getAttribute("data-filter") || "all";
      setActiveFilter(button);
      applyProjectFilter(filterValue);
    });
  });
}
