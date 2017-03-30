(ns prose.modeler
  (:require [prose.utilities :refer :all]
            [clojure.walk :refer :all]
            [clojurewerkz.neocons.rest :as nr]
            [clojurewerkz.neocons.rest.cypher :as cy]
            [clj-time.core :as t]))

(def db (nr/connect "http://neo4j:pass0202@localhost:7474/db/data/"))

(def alphanumeric "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz")

(defn- get-random-id
  [length]
  (apply str (repeatedly length (fn [] (rand-nth alphanumeric)))))

(defn- get-random-id-group
  [amount length]
  (repeatedly amount (fn [] (get-random-id length))))

(defn- get-unused-ids
  [amount length]
  (loop
    [ids (get-random-id-group amount length)]
    (let
      [result (cy/tquery (read-resource "cypher/graph/get_ids.cypher") {:ids ids})]
      (if (empty? result)
        (keywordize-keys (apply merge (map hash-map (map (fn [x] (str "id_" (+ x 1))) (range amount)) ids)))
        (recur (get-random-id-group amount length))))))

(defn- args-count
  [f]
  (let [m (first (.getDeclaredMethods (class f)))
        p (.getParameterTypes m)]
    (alength p)))

(defn- supply-modifier
  [func a b c]
  (let [args (args-count func)]
    (case args
      1 (func a)
      2 (func a b)
      3 (func a b c))))

(defn- supply-validator
  [func a b]
  (let [args (args-count func)]
    (case args
      1 (func a)
      2 (func a b))))

(defn- modify-input-upon-modifier
  [input ids modifier]
  (if (integer? ids)
    (let
      [new-ids (get-unused-ids ids 5)
       new-input (merge input new-ids {:timestamp (str (t/now))})]
      (if modifier (modifier new-input) new-input))
    (if modifier (modifier input) input)))

(defn- modify-output-upon-modifier
  [result input params modifier]
  (if modifier (supply-modifier modifier result input params) result))

(defn- limit-upon-limiter
  [result limiter]
  (if limiter
    (if (= limiter 1) (first result) (take limiter result))
    result))

(defn- validate-upon-validator
  [input params validator]
  (if validator (supply-validator validator input params) nil))

(defn query
  [properties]
  (fn [params]
    (let
      [input (modify-input-upon-modifier params (:ids properties) (:input properties))
       corrections (validate-upon-validator input params (:validation properties))]
      (if corrections
        corrections
        (let
          [result (cy/tquery (read-resource (:filename properties)) input)
           pruned-result (limit-upon-limiter (keywordize-keys result) (:limit properties))
           output (modify-output-upon-modifier pruned-result input params (:output properties))]
          output)))))

(defmacro defquery
  [name properties]
  `(def ~name (query ~properties)))

;Examples

#_(def local-find-by-email
    (query
     {:filename "cypher/user/local_find_by_email.cypher"
      :ids 1
      :limit 1
      :input (fn [params] params)
      :validation (fn [input] input)
      :output (fn [result input params] result)}))

#_(local-find-by-email {:email "jdj@gmail.com"})

#_(defquery find-by-id
    {:filename "cypher/user/find_by_id.cypher"
     :limit 1
     :validator (fn [input params] nil)
     :output (fn [result input params] [(:name result)
                                        (:user_id input)
                                        (:user_id params)])})

#_(find-by-id {:user_id "SU4J3"})

