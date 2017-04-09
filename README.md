# Roboprose

Roboprose was a site I ran for a few writing buddies back in 2014.

It presented a group of strangers with a novel, one single novel, and allowed them to contribute one paragraph at a time. The only pre-authored content was the opening paragraph. After that, writers could either build upon each other or "branch" off into their own weird tangents. There was some logic to help readers and prospective writers automatically find the most active and interesting branches.

# Technical notes

The back-end was written in Clojure and can be found in `src`. The data store was Neo4j, a graph database. Query templates can be found in `resources/cypher`.

The front-end was written in React. React code can be found in `resources/public/js/src`. Keep in mind that this was 2014, the early days of React's public release, before the "Flux pattern" was widely appreciated. I learned a lot of hard lessons about how to manage state throughout a React app.

# Running the app, kinda

Unfortunately, the user authentication was built on top of [Mozilla Persona](https://en.wikipedia.org/wiki/Mozilla_Persona), which is now dead. You would need to rewrite those bits to really get this thing usable.

With that said, first you'll need to get a copy of neo4j up and running. Here's an easy way to pull that off with Docker.

```
docker run \
    --publish=7474:7474 \
    --volume=$HOME/neo4j/data:/data \
    --env=NEO4J_AUTH=none \
    neo4j:2.3
```

Next, you'll need to install [Leiningen](https://leiningen.org/). From there, just go to the directory of this project and...

```
lein repl
```

...or...

```
lein run
```

A phony book can be created for sample use by running `(create-fake-book)` from `src/prose/fixtures/invisibleman.clj`.
