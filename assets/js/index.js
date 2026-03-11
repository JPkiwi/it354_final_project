const buttons = document.querySelectorAll("[data-carousel-button]")

buttons.forEach(button => {
    button.addEventListener("click", () => {
        // If the "next" button is selected, we go to the next image.
        // Otherwise, if the other button (prev) is selected, we go back one.
        const offset = button.dataset.carouselButton === "next" ? 1 : -1
        
        // retrieves the data carousel, which is the parent element of our slides
        const slides = button.closest("[data-carousel]").querySelector("[data-slides]")

        // selects our active slide
        const activeSlide = slides.querySelector("[data-active]")

        // creates an array of all of our slides
        // & then adds in our offset (either going forward 1 or back 1)
        let newIndex = [...slides.children].indexOf(activeSlide) + offset

        // if we go from our first image to our last, this sets our index
        // to our LAST image
        if (newIndex < 0){
            newIndex = slides.children.length - 1
        }

        // if we loop all the way back to the beginning, this sets our
        // index back to 0, the FIRST image.
        if (newIndex >= slides.children.length){
            newIndex = 0
        }

        // ADDS the data-active attribute to our CURRENT active slide
        slides.children[newIndex].dataset.active = true
        // DELETES the data-active attribute to our PREVIOUS active slide
        delete activeSlide.dataset.active
    })
})