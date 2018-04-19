# Frontend - Async calls (Ajax)

Javascript deals well with asynchronous calls like network requests. Historically, a reply was delivered though callback functions:

```js
request(arguments, function callback(error, result) {
  // do something with result
});
```

But this may lead to spaghetti code therefore Promises were introduced:

```js
var resultPromise = request(arguments);
resultPromise.then(function callback(result) {
  // Promise fulfilled, do something with result
});
resultPromise.catch(function callback(error) {
  // handle expections
});
```

The `await` keyword pauses asynchronous function until Promise is fulfilled.

```js
try {
  var resultPromise = await request(arguments);
} catch (error) {

}
```

The promises can be integrated in the model in order to handle HTTP requests. This is possible through `fetch` method:
```js
class Model extends Observable {
  async fetchImages() {
    const response = await fetchClient('/api/images').catch((error) => this.handleErrors(error));
    const images = await response.json();
    this.setImages(images);
  }

  setImages(images) {
    this.images = images;
    this.notify();
  }

  handleErrors(error) {
    this.error = error;
    this.notify();
  }
}
```

The `fetchClient` method is part of the framework, creates an HTTP request and returns a promise. Either `await` keyword or `then` method can be used to handle fulfilled promise.

Error can be handled within a `try`,  `catch` blocks or using `catch` method of the promise object. It is a recommended to use a generic error handler.
`fetchImages` also returns a promise because it has `async` keyword.

Because the web interface is not blocked when the method is paused with `await` keyword, the user can call it many times leading to unnecessary network usage. Repeated requests to the same resource can be avoid by adding a new state in the model, `fetchingImages` boolean in the following example does this:

```js
class Model extends Observable {
  async fetchImages() {
    if (this.fetchingImages) {
      return;
    }

    this.fetchingImages = true;
    this.notify();

    const response = await fetchClient('/api/images').catch((error) => this.handleErrors(error));
    const images = await response.json();
    this.setImages(images);

    this.fetchingImages = false;
    this.notify();
  }

  setImages(images) {
    this.images = images;
    this.notify();
  }

  handleErrors(error) {
    this.error = error;
    this.notify();
  }
}

function button(model) {
  const action = () => model.fetchImages();
  const disabled = model.fetchingImages;

  // clicks are not handled when a button is 'disabled'
  return h('button', {onclick: action, disabled: disabled}, 'Fetch images')
}
```