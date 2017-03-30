(ns prose.utilities
  (:require [clojure.java.io :as io]
            [clojure.data.json :as j]))

(defn parse-integer
  "Converts a string into an integer."
  [string]
  (Integer. (re-find #"[0-9]*" string)))

(defn read-resource
  "Reads a resource from the classpath into a string."
  [path]
  (slurp (io/resource path)))

(defn read-file
  "Reads a file into a string."
  [path]
  (slurp (io/file path)))

(defn find-all-resources
  "Find all resources matching regex pattern below given dir. Recursive."
  [classpath-dir pattern]
  (doall
   (filter
    (fn [x] (re-matches pattern (.getName x)))
    (file-seq (io/file (io/resource classpath-dir))))))

(defn check-json [input]
  (j/read-json input true false println("Empty JSON")))
