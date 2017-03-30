(ns prose.middleware
  (:require [clojure.pprint :refer :all]))

(defn print-rings [handler]
  (fn [request]
    (println "-------------------------------")
    (println "Incoming Request:")
    (pprint request)
    (let [response (handler request)]
      (println "Outgoing Response Map:")
      (pprint (dissoc response :body))
      (println "-------------------------------")
      response)))
