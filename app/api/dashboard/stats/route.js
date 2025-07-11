import {createClient} from '@/utils/supabase/server'
import {NextResponse} from 'next/server'

export async function GET(request) {
    try {
        const supabase = await createClient()

        const {data: {user}, error: authError} = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        // Get user profile to determine role
        const {data: profile} = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({error: 'Profile not found'}, {status: 404})
        }

        let stats = {}

        if (profile.role === 'patient') {
            // Get patient statistics
            const {data: patient} = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (patient) {
                // Total appointments
                const {count: totalAppointments} = await supabase
                    .from('appointments')
                    .select('*', {count: 'exact', head: true})
                    .eq('patient_id', patient.id)

                // Upcoming appointments
                const {data: upcomingAppointments} = await supabase
                    .from('appointments')
                    .select('*, time_slots(date, start_time)')
                    .eq('patient_id', patient.id)
                    .eq('status', 'scheduled')
                    .gte('time_slots.date', new Date().toISOString().split('T')[0])
                    .order('time_slots(date)', {ascending: true})
                    .limit(1)

                // Recent appointments
                const {data: recentAppointments} = await supabase
                    .from('appointments')
                    .select(`
                        *,
                        time_slots(date, start_time),
                        doctors(name, specialization)
                    `)
                    .eq('patient_id', patient.id)
                    .neq('status', 'cancelled')
                    .lt('time_slots.date', new Date().toISOString().split('T')[0])
                    .order('time_slots(date)', {ascending: false})
                    .limit(3)

                // Get most frequent doctor (primary doctor)
                const {data: doctorFrequency} = await supabase
                    .from('appointments')
                    .select('doctors(name)')
                    .eq('patient_id', patient.id)
                    .neq('status', 'cancelled')

                let primaryDoctor = null
                if (doctorFrequency && doctorFrequency.length > 0) {
                    // Find most frequent doctor
                    const doctorCounts = {}
                    doctorFrequency.forEach(apt => {
                        const doctorName = apt.doctors?.name
                        if (doctorName) {
                            doctorCounts[doctorName] = (doctorCounts[doctorName] || 0) + 1
                        }
                    })
                    primaryDoctor = Object.keys(doctorCounts).reduce((a, b) =>
                        doctorCounts[a] > doctorCounts[b] ? a : b, Object.keys(doctorCounts)[0]
                    )
                }

                stats = {
                    totalAppointments: totalAppointments || 0,
                    nextAppointment: upcomingAppointments?.[0] || null,
                    recentAppointments: recentAppointments || [],
                    primaryDoctor: primaryDoctor
                }
            }
        } else if (profile.role === 'doctor') {
            // Get doctor statistics
            const {data: doctor} = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single()
            if (doctor) {
                // Today's appointments
                const today = new Date().toISOString().split('T')[0]
                const {count: todayAppointments} = await supabase
                    .from('appointments')
                    .select('*', {count: 'exact', head: true})
                    .eq('doctor_id', doctor.id)
                    .eq('time_slots.date', today)

                // Total patients (unique)
                const {count: totalPatients} = await supabase
                    .from('appointments')
                    .select('patient_id', {count: 'exact', head: true})
                    .eq('doctor_id', doctor.id)

                // Available slots today
                const {count: availableSlots} = await supabase
                    .from('time_slots')
                    .select('*', {count: 'exact', head: true})
                    .eq('doctor_id', doctor.id)
                    .eq('date', today)
                    .eq('is_available', true)

                // This week's appointments
                const weekStart = new Date()
                weekStart.setDate(weekStart.getDate() - weekStart.getDay())
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)

                const {count: weekAppointments} = await supabase
                    .from('appointments')
                    .select('*', {count: 'exact', head: true})
                    .eq('doctor_id', doctor.id)
                    .gte('time_slots.date', weekStart.toISOString().split('T')[0])
                    .lte('time_slots.date', weekEnd.toISOString().split('T')[0])

                // Today's schedule
                const {data: todaySchedule} = await supabase
                    .from('appointments')
                    .select('*, time_slots(start_time, end_time), patients(full_name)')
                    .eq('doctor_id', doctor.id)
                    .eq('time_slots.date', today)
                    .eq('status', 'scheduled')
                    .order('time_slots(start_time)', {ascending: true})

                // Recent patients
                const {data: recentPatients} = await supabase
                    .from('appointments')
                    .select('*, patients(full_name, email), time_slots(date)')
                    .eq('doctor_id', doctor.id)
                    .neq('status', 'cancelled')
                    .order('created_at', {ascending: false})
                    .limit(5)


                stats = {
                    todayAppointments: todayAppointments || 0,
                    totalPatients: totalPatients || 0,
                    availableSlots: availableSlots || 0,
                    weekAppointments: weekAppointments || 0,
                    todaySchedule: todaySchedule || [],
                    recentPatients: recentPatients || []
                }
            }
        }
        console.log("stats", stats)

        return NextResponse.json({stats, role: profile.role})
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json({error: error.message}, {status: 500})
    }
}