const searchForm = document.querySelector('#search-form'),
    filterSortForm = document.querySelector('#filterSort'),
    movie = document.querySelector('#movies'),
    urlApi = 'http://www.omdbapi.com/?apikey=84d24dd&',
    itemsNum = 12;


let pageNum = 0,
    items = [],
    allItems = [],
    endOffList = false

function FetchIt() {
    const searchText = document.querySelector('#search-text').value;
    pageNum++;
    if (searchText.trim().length == 0) {
        movie.innerHTML = '<h2 class="full-line textTop error">Search field must not be empty</h2>';
        return;
    }
    fetch(`${urlApi}type=series&page=${pageNum}&s=${searchText}`)
        .then(function (value) {
            if (value.status != 200) {
                return Promise.reject(value);
            }
            return value.json();
        })
        .then(function (output) {
            if (output.Error === "Too many results.") {
                movie.innerHTML = "Too many results! Please be more precise...";
                return
            } else if (output.Error === "Series not found!") {
                movie.innerHTML = "Nothing found!";
                return
            };
            let l = output.Search.length;
            if (l < 10) endOffList = true;
            output.Search.forEach(function (item) {

                fetch(`${urlApi}i=${item.imdbID}&plot=full`)
                    .then(function (value) {
                        if (value.status != 200) {
                            return Promise.reject(value);
                        }
                        return value.json();
                    })
                    .then(function (output) {
                        let plotMin = output.Plot.substr(0, 100);
                        if (plotMin === 'N/A') {
                            plotMin = 'No info.'
                        };
                        const img_src = output.Poster === 'N/A' ? './images/noposter.jpg' : output.Poster;
                        let dataInfo = `data-id="${output.imdbID}" data-type="${output.Type}"`;
                        let item = {
                            Plot: plotMin,
                            Img_src: img_src,
                            DataInfo: dataInfo,
                            Title: output.Title,
                            Released: output.Released,
                            imdbRating: output.imdbRating,
                            Runtime: output.Runtime,
                            Awards: output.Awards,
                            Year: output.Year
                        };
                        items.push(item);
                        --l;
                        if (l === 0) checkRenderReady();
                    })
            })
        })
        .catch(function (reason) {
            console.error('error: ' + reason);
        });
}

function apiSearch(event) {
    event.preventDefault();
    pageNum = 0;
    movie.innerHTML = '';
    endOffList = false;
    FetchIt();
}

function checkRenderReady() {
    if (endOffList || (items.length >= itemsNum)) {
        const itemsR = items.splice(0, itemsNum);
        itemsR.forEach(function (item) {
            allItems.push(item);
        })
        render(itemsR);
    } else FetchIt();
    body.classList.remove("load");
    busy = false;
}

function render(items) {
    if (items.length == 0) return;
    items.forEach(function (item) {
        const movieItem = `
        <div class="full-line half-line four-line item">
            <img class="poster" src="${item.Img_src}" alt="No Image" ${item.DataInfo}><br>
            <strong>${item.Title}</strong>
            <p><b>Release:</b> ${item.Released === 'N/A' ? 'No info.' :`${item.Released}`}</p>
            <p><b>IMDB Rating:</b> ${item.imdbRating === 'N/A' ? 'No info.':`${item.imdbRating}`}</p>
            <p><b>Runtime:</b> ${item.Runtime === 'N/A' ? 'No info.' :`${item.Runtime}
            `}</p>
            <p><b>Awards or Nominations:</b> ${item.Awards === 'N/A'? 'No Awards':`${item.Awards}`}</p>
            <p><b>Overview:</b> ${item.Plot.length<100?`${item.Plot}`:`${item.Plot}...`}</p>
        </div>`;
        movie.innerHTML += movieItem;
    })
    lastTableRow = document.querySelector('.item:last-child');
}
searchForm.addEventListener('submit', apiSearch);


//autoloading

let body = document.querySelector('body');
let lastTableRow = document.querySelector('.item:last-child');
let busy;

function ajaxLoader() {
    if (busy) return;
    if (endOffList) return;
    busy = true;
    body.classList.add("load");
    onAjaxSuccess();
}

function onAjaxSuccess() {
    FetchIt();
}


function checkAjaxLoading() {
    let bottomCoord = lastTableRow.getBoundingClientRect().bottom;
    let height = document.documentElement.clientHeight;
    if (height >= bottomCoord) {
        ajaxLoader();
    }
}

window.addEventListener('scroll', function () {
    checkAjaxLoading();
});


//filter

filterSortForm.addEventListener('submit', SubmitFilter);


function filterItems(yearFrom, yearTo, ratingFrom, ratingTo) {
    let filteredItems = allItems;
    if (yearFrom) {
        filteredItems = filteredItems.filter((item) => {
            return (+item.Year >= +yearFrom && +item.Year <= +yearTo);
        });
    }
    if (ratingFrom) {
        filteredItems = filteredItems.filter((item) => {
            return (+item.imdbRating >= +ratingFrom && +item.imdbRating <= +ratingTo);
        });
    }
    movie.innerHTML = '';
    render(filteredItems);
    endOffList = true
}


function SubmitFilter(event) {
    event.preventDefault();

    let yearFrom = document.querySelector('#From').value,
        yearTo = document.querySelector('#To').value,
        ratingFrom = document.querySelector('#RFrom').value,
        ratingTo = document.querySelector('#RTo').value

    if (yearFrom && yearTo && ratingFrom && ratingTo) {
        filterItems(yearFrom, yearTo, ratingFrom, ratingTo)
    } else if (yearFrom && yearTo) {
        filterItems(yearFrom, yearTo)
    } else if (ratingFrom && ratingTo) {
        filterItems(undefined, undefined, ratingFrom, ratingTo)
    } else {
        movie.innerHTML = '';
        render(allItems);
        endOffList = false
    }

}


//sort
const buttonName = document.querySelector('#Title'),
    buttonRating = document.querySelector('#imdbRating'),
    buttonDate = document.querySelector('#Released')


const sortItems = function (event) {
    const name = event.target.id;
    allItems.sort(function (fItem, sItem) {
        let a = fItem[name];
        let b = sItem[name];
        if (name == 'Released') {
            a = new Date(a);
            b = new Date(b);
        }
        if (a > b) return 1;
        if (a == b) return 0;
        if (a < b) return -1;
    });
    movie.innerHTML = '';
    render(allItems);
}

buttonName.addEventListener('click', sortItems)
buttonRating.addEventListener('click', sortItems)
buttonDate.addEventListener('click', sortItems)