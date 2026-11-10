import { loadSavedAdmits } from './admitStore';
import { TicketLibrary } from './TicketLibrary';
import { savedTicketItems } from './ticketLibraryModel';
export function SavedPhoneTickets({ onConnect, onBrowseEvents }: { onConnect?: () => void; onBrowseEvents?: () => void }) {
  return <TicketLibrary items={savedTicketItems(loadSavedAdmits())} onBrowseEvents={onBrowseEvents} controls={()=><p className="small muted">{onConnect ? <button type="button" onClick={onConnect}>Connect to resell</button> : 'Connect the owning wallet to manage resale.'}</p>} />;
}
