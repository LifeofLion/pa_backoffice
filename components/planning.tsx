"use client"

import { useState, useCallback } from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import "react-big-calendar/lib/css/react-big-calendar.css"
import moment from "moment"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, MapPin, User } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useMediaQuery } from "@/hooks/use-mobile"

// Styles personnalisés pour le calendrier
import "./planning-styles.css"

const localizer = momentLocalizer(moment)

type Event = {
  id: string
  title: string
  start: Date
  end: Date
  location?: string
  client?: string
  description?: string
  status?: "confirmed" | "pending" | "cancelled"
}

type Props = {
  events: Event[]
}

export default function Planning({ events }: Props) {
  const { t } = useLanguage()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [view, setView] = useState(isMobile ? Views.DAY : Views.WEEK)
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  // Mise à jour de la vue en fonction de la taille de l'écran
  const handleViewChange = useCallback((newView: string) => {
    setView(newView)
  }, [])

  // Gestion des événements sélectionnés
  const handleSelectEvent = useCallback((event: Event) => {
    setSelectedEvent(event)
  }, [])

  // Fermer le détail de l'événement
  const closeEventDetail = () => {
    setSelectedEvent(null)
  }

  // Personnalisation de l'affichage des événements
  const eventPropGetter = useCallback((event: Event) => {
    let backgroundColor = "#8CD790"
    let borderColor = "#7ac57e"

    if (event.status === "pending") {
      backgroundColor = "#F8A097"
      borderColor = "#f78e84"
    } else if (event.status === "cancelled") {
      backgroundColor = "#E57373"
      borderColor = "#e25f5f"
    }

    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "4px",
        color: "white",
        fontWeight: 500,
        padding: "4px 8px",
      },
    }
  }, [])

  // Personnalisation des composants du calendrier
  const components = {
    toolbar: CustomToolbar,
    event: CustomEvent,
  }

  // Fonction pour naviguer dans le calendrier
  function navigateCalendar(action: "PREV" | "NEXT" | "TODAY") {
    const newDate = new Date(date)

    if (action === "PREV") {
      if (view === Views.DAY) newDate.setDate(date.getDate() - 1)
      else if (view === Views.WEEK) newDate.setDate(date.getDate() - 7)
      else if (view === Views.MONTH) newDate.setMonth(date.getMonth() - 1)
    } else if (action === "NEXT") {
      if (view === Views.DAY) newDate.setDate(date.getDate() + 1)
      else if (view === Views.WEEK) newDate.setDate(date.getDate() + 7)
      else if (view === Views.MONTH) newDate.setMonth(date.getMonth() + 1)
    } else if (action === "TODAY") {
      return setDate(new Date())
    }

    setDate(newDate)
  }

  // Composant personnalisé pour la barre d'outils
  function CustomToolbar({ label }: any) {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#8CD790] text-[#8CD790] hover:bg-[#8CD790] hover:text-white"
            onClick={() => navigateCalendar("TODAY")}
          >
            {t("calendar.today")}
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateCalendar("PREV")}
              className="text-gray-600 hover:text-[#8CD790]"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold px-2">{label}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateCalendar("NEXT")}
              className="text-gray-600 hover:text-[#8CD790]"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === Views.DAY ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange(Views.DAY)}
            className={view === Views.DAY ? "bg-[#8CD790] hover:bg-[#7ac57e]" : ""}
          >
            {t("calendar.day")}
          </Button>
          <Button
            variant={view === Views.WEEK ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange(Views.WEEK)}
            className={view === Views.WEEK ? "bg-[#8CD790] hover:bg-[#7ac57e]" : ""}
          >
            {t("calendar.week")}
          </Button>
          <Button
            variant={view === Views.MONTH ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange(Views.MONTH)}
            className={view === Views.MONTH ? "bg-[#8CD790] hover:bg-[#7ac57e]" : ""}
          >
            {t("calendar.month")}
          </Button>
        </div>
      </div>
    )
  }

  // Composant personnalisé pour les événements
  function CustomEvent({ event }: { event: Event }) {
    return <div className="overflow-hidden text-ellipsis whitespace-nowrap">{event.title}</div>
  }

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            date={date}
            onView={handleViewChange}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            components={components}
            className="ecodeli-calendar"
            dayLayoutAlgorithm="no-overlap"
          />
        </CardContent>
      </Card>

      {/* Détail de l'événement sélectionné */}
      {selectedEvent && (
        <Card className="border-none shadow-lg rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
              <Button variant="ghost" size="sm" onClick={closeEventDetail}>
                ✕
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarIcon className="h-4 w-4" />
                <span>{moment(selectedEvent.start).format("dddd, MMMM D, YYYY")}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {moment(selectedEvent.start).format("h:mm A")} - {moment(selectedEvent.end).format("h:mm A")}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.client && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{selectedEvent.client}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-700">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.status && (
                <div className="mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedEvent.status === "confirmed"
                        ? "bg-[#8CD790]/20 text-[#8CD790]"
                        : selectedEvent.status === "pending"
                          ? "bg-[#F8A097]/20 text-[#F8A097]"
                          : "bg-[#E57373]/20 text-[#E57373]"
                    }`}
                  >
                    {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}