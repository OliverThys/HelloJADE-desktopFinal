from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests
import json
from datetime import datetime

class ActionValidateIdentity(Action):
    def name(self) -> Text:
        return "action_validate_identity"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Simuler la validation d'identité
        patient_confirmed = tracker.get_slot("patient_confirmed")
        
        if patient_confirmed:
            dispatcher.utter_message(text="Identité confirmée. Passons à la vérification de votre date de naissance.")
            return [SlotSet("identity_verified", True)]
        else:
            dispatcher.utter_message(text="Je n'ai pas bien compris. Pouvez-vous confirmer votre identité ?")
            return [SlotSet("identity_verified", False)]

class ActionValidateBirthDate(Action):
    def name(self) -> Text:
        return "action_validate_birth_date"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        birth_date = tracker.get_slot("birth_date")
        
        if birth_date:
            dispatcher.utter_message(text="Date de naissance confirmée. Passons aux questions médicales.")
            return [SlotSet("birth_date_verified", True)]
        else:
            dispatcher.utter_message(text="Je n'ai pas bien compris votre date de naissance. Pouvez-vous répéter ?")
            return [SlotSet("birth_date_verified", False)]

class ActionValidatePainLevel(Action):
    def name(self) -> Text:
        return "action_validate_pain_level"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        pain_level = tracker.get_slot("pain_level")
        
        if pain_level is not None:
            pain_level = float(pain_level)
            if pain_level > 7:
                dispatcher.utter_message(text="Je note un niveau de douleur élevé. Où avez-vous mal exactement ?")
            else:
                dispatcher.utter_message(text="Merci. Où avez-vous mal ?")
            return [SlotSet("pain_level_verified", True)]
        else:
            dispatcher.utter_message(text="Je n'ai pas bien compris le niveau de douleur. Pouvez-vous répéter de 0 à 10 ?")
            return [SlotSet("pain_level_verified", False)]

class ActionValidateMedication(Action):
    def name(self) -> Text:
        return "action_validate_medication"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        medication_compliance = tracker.get_slot("medication_compliance")
        
        if medication_compliance is not None:
            if not medication_compliance:
                dispatcher.utter_message(text="Je note que vous avez des difficultés avec vos médicaments. Passons à la question suivante.")
            else:
                dispatcher.utter_message(text="Parfait. Passons à la question suivante.")
            return [SlotSet("medication_verified", True)]
        else:
            dispatcher.utter_message(text="Je n'ai pas bien compris. Prenez-vous vos médicaments comme prescrit ?")
            return [SlotSet("medication_verified", False)]

class ActionValidateTransit(Action):
    def name(self) -> Text:
        return "action_validate_transit"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        transit_normal = tracker.get_slot("transit_normal")
        
        if transit_normal is not None:
            if not transit_normal:
                dispatcher.utter_message(text="Je note un problème de transit. Quel est le problème exactement ?")
            else:
                dispatcher.utter_message(text="Parfait. Passons à la question suivante.")
            return [SlotSet("transit_verified", True)]
        else:
            dispatcher.utter_message(text="Je n'ai pas bien compris. Allez-vous aux toilettes normalement ?")
            return [SlotSet("transit_verified", False)]

class ActionValidateMood(Action):
    def name(self) -> Text:
        return "action_validate_mood"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        mood_level = tracker.get_slot("mood_level")
        
        if mood_level is not None:
            mood_level = float(mood_level)
            if mood_level < 7:
                dispatcher.utter_message(text="Je note un moral un peu bas. Que ressentez-vous exactement ?")
            else:
                dispatcher.utter_message(text="Merci. Passons à la question suivante.")
            return [SlotSet("mood_verified", True)]
        else:
            dispatcher.utter_message(text="Je n'ai pas bien compris. Votre moral aujourd'hui, de 0 à 10 ?")
            return [SlotSet("mood_verified", False)]

class ActionValidateFever(Action):
    def name(self) -> Text:
        return "action_validate_fever"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        fever_present = tracker.get_slot("fever_present")
        
        if fever_present is not None:
            if fever_present:
                dispatcher.utter_message(text="Je note de la fièvre. Quelle est votre température ?")
            else:
                dispatcher.utter_message(text="Parfait. Passons à la dernière question.")
            return [SlotSet("fever_verified", True)]
        else:
            dispatcher.utter_message(text="Je n'ai pas bien compris. Avez-vous de la fièvre ?")
            return [SlotSet("fever_verified", False)]

class ActionValidateOtherComplaints(Action):
    def name(self) -> Text:
        return "action_validate_other_complaints"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        other_complaints = tracker.get_slot("other_complaints")
        
        if other_complaints:
            dispatcher.utter_message(text="Merci pour ces informations. Je vais maintenant calculer votre score médical.")
        else:
            dispatcher.utter_message(text="Parfait. Je vais maintenant calculer votre score médical.")
        
        return [SlotSet("other_complaints_verified", True)]

class ActionCalculateScore(Action):
    def name(self) -> Text:
        return "action_calculate_score"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Récupérer toutes les réponses
        pain_level = float(tracker.get_slot("pain_level") or 0)
        medication_compliance = tracker.get_slot("medication_compliance")
        transit_normal = tracker.get_slot("transit_normal")
        mood_level = float(tracker.get_slot("mood_level") or 10)
        fever_present = tracker.get_slot("fever_present")
        other_complaints = tracker.get_slot("other_complaints") or ""

        # Calcul du score (algorithme HelloJADE)
        score = 100

        # Pénalités
        if pain_level > 5:
            score -= 20
        if not medication_compliance:
            score -= 15
        if not transit_normal:
            score -= 10
        if mood_level < 5:
            score -= 15
        if fever_present:
            score -= 20

        # Mots-clés d'urgence
        emergency_keywords = ["urgence", "ambulance", "hôpital", "douleur forte", "sang", "crise"]
        if any(keyword in other_complaints.lower() for keyword in emergency_keywords):
            score -= 20

        # Score final (minimum 0)
        final_score = max(0, score)

        # Catégorie du score
        if final_score >= 80:
            category = "excellent"
            message = f"Excellent ! Votre score médical est de {final_score}/100. Votre état de santé est très bon."
        elif final_score >= 60:
            category = "good"
            message = f"Bien ! Votre score médical est de {final_score}/100. Votre état de santé est correct."
        elif final_score >= 40:
            category = "moderate"
            message = f"Votre score médical est de {final_score}/100. Une surveillance est recommandée."
        else:
            category = "poor"
            message = f"Votre score médical est de {final_score}/100. Une attention médicale est requise."

        dispatcher.utter_message(text=message)

        return [
            SlotSet("medical_score", final_score),
            SlotSet("score_category", category)
        ]

class ActionDetectEmergency(Action):
    def name(self) -> Text:
        return "action_detect_emergency"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Détection d'urgence
        pain_level = float(tracker.get_slot("pain_level") or 0)
        fever_present = tracker.get_slot("fever_present")
        other_complaints = tracker.get_slot("other_complaints") or ""

        emergency_detected = False

        # Critères d'urgence
        if pain_level > 7:
            emergency_detected = True
        if fever_present:
            emergency_detected = True
        if any(keyword in other_complaints.lower() for keyword in ["urgence", "ambulance", "hôpital", "sang", "crise"]):
            emergency_detected = True

        if emergency_detected:
            dispatcher.utter_message(text="URGENCE DÉTECTÉE ! Vous allez être transféré vers les services d'urgence immédiatement.")
            return [SlotSet("emergency_detected", True)]
        else:
            return [SlotSet("emergency_detected", False)]

class ActionSaveCallResults(Action):
    def name(self) -> Text:
        return "action_save_call_results"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Collecter toutes les données de l'appel
        call_data = {
            "timestamp": datetime.now().isoformat(),
            "patient_confirmed": tracker.get_slot("patient_confirmed"),
            "birth_date": tracker.get_slot("birth_date"),
            "pain_level": tracker.get_slot("pain_level"),
            "pain_location": tracker.get_slot("pain_location"),
            "medication_compliance": tracker.get_slot("medication_compliance"),
            "transit_normal": tracker.get_slot("transit_normal"),
            "transit_problem": tracker.get_slot("transit_problem"),
            "mood_level": tracker.get_slot("mood_level"),
            "mood_details": tracker.get_slot("mood_details"),
            "fever_present": tracker.get_slot("fever_present"),
            "temperature": tracker.get_slot("temperature"),
            "other_complaints": tracker.get_slot("other_complaints"),
            "medical_score": tracker.get_slot("medical_score"),
            "score_category": tracker.get_slot("score_category"),
            "emergency_detected": tracker.get_slot("emergency_detected")
        }

        # Ici, vous pourriez envoyer les données vers votre API backend
        # try:
        #     response = requests.post("http://backend:3000/api/calls/results", json=call_data)
        #     if response.status_code == 200:
        #         dispatcher.utter_message(text="Vos réponses ont été sauvegardées avec succès.")
        #     else:
        #         dispatcher.utter_message(text="Erreur lors de la sauvegarde.")
        # except:
        #     dispatcher.utter_message(text="Problème de connexion avec le serveur.")

        # Pour le test, on simule juste la sauvegarde
        dispatcher.utter_message(text="Vos réponses ont été transmises à votre équipe médicale.")

        return [SlotSet("call_saved", True)]
