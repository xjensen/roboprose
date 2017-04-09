(defproject prose "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [clojurewerkz/neocons "3.1.0"]
                 [org.clojure/data.json "0.2.6"]
                 [ring/ring-json "0.4.0"]
                 [compojure "1.4.0"]
                 [lib-noir "0.9.9"]
                 [clj-time "0.11.0"]
                 [hiccup "1.0.5"]
                 [com.cemerick/friend "0.2.1"
                  :exclusions [commons-logging
                               commons-codec
                               slingshot
                               org.apache.httpcomponents/httpclient
                               org.clojure/core.cache]]]
  :main prose.core)
