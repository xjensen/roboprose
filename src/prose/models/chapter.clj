(ns prose.models.chapter
  (:require [prose.utilities :refer :all]
            [prose.validation :refer :all]
            [prose.modeler :refer :all]
            [noir.validation :as vali]))

(defquery create
  {:filename "cypher/chapter/create.cypher"
   :ids 1
   :limit 1
   :input (fn [params]
            (merge params {:char_count (+ 400 (count (:content params)))}))
   :output (fn [result input params]
             {:parent_id (:parent_id input)
              :contents [(merge result {:children []})]})})

;Examples

#_(create {:parent_id "GD87l"
           :user_id "2vsRN"
           :title "Test Clojure Chapter"
           :content "First Clojure paragraph."})
