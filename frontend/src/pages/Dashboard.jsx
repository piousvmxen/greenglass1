import { useAuth } from '../context/AuthContext'
import UserDashboard from './UserDashboard'
import CollectorDashboard from './CollectorDashboard'

const Dashboard = () => {
  const { user } = useAuth()

  if (!user) return null

  if (user.role === 'collector') return <CollectorDashboard />

  return <UserDashboard />
}

export default Dashboard
