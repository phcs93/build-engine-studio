// horizontal-scroll by phcs93

document.addEventListener("DOMContentLoaded", () => {

    // event listener on body to make it work on dynamically created elements
    document.body.addEventListener("wheel", e => {

        const element = e.target.closest("div.horizontal-scroll");

        if (element) {
            element.scrollLeft += e.deltaY;
        }

    });

});