(ns prose.models.paragraph
  (:require [prose.utilities :refer :all]
            [prose.validation :refer :all]
            [prose.modeler :refer :all]
            [noir.validation :as vali]))

(defquery create
  {:filename "cypher/paragraph/create.cypher"
   :ids 1
   :limit 1
   :input (fn [params]
            (merge params {:char_count (count (:content params))}))
   :output (fn [result input params]
             {:parent_id (:parent_id input)
              :contents [(merge result {:children []})]})})

;Examples

#_(create {:parent_id "QxDWl"
           :user_id "2vsRN"
           :content "First Clojure paragraph."})
