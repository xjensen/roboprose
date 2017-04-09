(ns prose.models.apu
  (:require [prose.utilities :refer :all]
            [prose.validation :refer :all]
            [prose.modeler :refer :all]
            [noir.validation :as vali]))

;Support Functions

(defn add-stub-to-labels
  [apu]
  (assoc apu :labels (conj (:labels apu) "Stub")))

;Queries

(defquery forward-discovery
  {:filename "cypher/apu/forward_discovery.cypher"
   :output (fn [result input params]
             {:parent_id (:parent_id input)
              :contents result})})

(defquery previous-range
  {:filename "cypher/apu/previous_range.cypher"
   :output (fn [result input params]
             {:parent_id (:parent_id input)
              :child_id (:child_id input)
              :contents result})})

(defquery forward-range
  {:filename "cypher/apu/forward_range.cypher"
   :output (fn [result input params]
             {:parent_id (:parent_id input)
              :child_id (:child_id input)
              :contents result})})

(defquery previous-chapters
  {:filename "cypher/apu/previous_chapters.cypher"
   :output (fn [result input params]
             {:location_id (:location_id input)
              :contents (map add-stub-to-labels result)})})

(defquery start-apu
  {:filename "cypher/apu/start_apu.cypher"
   :output (fn [result input params]
             {:location_id (:location_id input)
              :book (first result)
              :contents (rest result)})})

(defquery start-book
  {:filename "cypher/apu/start_book.cypher"
   :output (fn [result input params]
             {:book_id (:book_id input)
              :book (first result)
              :contents (rest result)})})

;Examples

#_(forward-discovery {:parent_id "QxDWl"})
#_(previous-range {:parent_id "QALEW" :child_id "QxDWl"})
#_(forward-range {:parent_id "QALEW" :child_id "QxDWl"})
#_(previous-chapters {:location_id "QxDWl"})
#_(start-apu {:location_id "QxDWl"})
#_(start-book {:book_id "sWnZb"})
