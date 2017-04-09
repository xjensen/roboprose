(ns prose.models.book
  (:require [prose.utilities :refer :all]
            [prose.validation :refer :all]
            [prose.modeler :refer :all]
            [noir.validation :as vali]))

(defquery create
  {:filename "cypher/book/create.cypher"
   :ids 2
   :limit 1
   :input (fn [params]
            (merge params {:char_count (+ 400 (count (:content params)))}))
   :output (fn [result input params]
             {:title (:book_title result)
              :id (:book_id result)
              :contents [(dissoc result :book_id :book_title)]})})

;Examples

#_(create {:book_title "Clojure test book"
           :user_id "2vsRN"
           :chapter_title "Test 1 Clojure Chapter"
           :content "First Clojure paragraph."})
