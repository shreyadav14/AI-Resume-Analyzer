import { Link, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import { usePuterStore } from '~/lib/puter'

const Navbar = () => {
  const { kv, fs } = usePuterStore()
  const [hasSavedResumes, setHasSavedResumes] = useState(false)
  const [isWiping, setIsWiping] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadSavedResumes = async () => {
      const items = (await kv.list('resume:*')) as string[] | undefined
      setHasSavedResumes((items?.length ?? 0) > 0)
    }

    loadSavedResumes()
  }, [kv])

  const handleWipe = async () => {
    setIsWiping(true)

    const files = (await fs.readDir('./')) ?? []
    await Promise.all(files.map((file) => fs.delete(file.path)))
    await kv.flush()

    setIsWiping(false)
    window.location.assign('/')
  }

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">ResumeMind</p>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/upload" className="primary-button w-fit">
          Upload Resume
        </Link>
        {hasSavedResumes && (
          <button
            type="button"
            onClick={handleWipe}
            className="secondary-button w-fit"
            disabled={isWiping}
          >
            {isWiping ? 'Wiping...' : 'Wipe App Data'}
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar
